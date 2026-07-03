import { prisma } from "@workspace/db-prisma";
import { AppError } from "../utils/app-error";
import { domainEventBus } from "../events/event-bus";
import { JobRepository, JobFilters, PaginationOptions } from "../repositories/job.repository";
import {
  JobCreatedEvent,
  JobUpdatedEvent,
  JobClosedEvent,
  JobOpenedEvent,
  JobArchivedEvent,
  JobRestoredEvent,
  JobAssignedEvent,
  JobApprovedEvent,
  JobClonedEvent,
} from "../events/job/job.events";

// ── Code Generator ────────────────────────────────────────────────────────────

async function generateJobCode(tenantId: string): Promise<string> {
  const year  = new Date().getFullYear();
  const count = await prisma.job.count({ where: { tenantId } });
  return `JOB-${year}-${String(count + 1).padStart(4, "0")}`;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const JobService = {

  // ── Create Job ───────────────────────────────────────────────────────────────

  async createJob(
    tenantId: string,
    body: {
      companyId:     string;
      title:         string;
      code?:         string;
      description?:  string;
      location:      string;
      jobType?:      string;
      urgency?:      string;
      salaryBand?:   string;
      salaryMin?:    number;
      salaryMax?:    number;
      currency?:     string;
      minExperience?: number;
      maxExperience?: number;
      jdText?:       string;
      openingsCount?: number;
      deadline?:     string;
      departments?:  string[];
      locations?:    Array<{ city: string; state?: string; country?: string }>;
      requirements?: Array<{ description: string; isRequired?: boolean }>;
      skills?:       Array<{ name: string; isRequired?: boolean }>;
      questions?:    Array<{ questionText: string; questionType?: string; options?: string[]; isRequired?: boolean }>;
      tags?:         string[];
    },
    performedById: string,
  ) {
    // Validate salary range
    if (body.salaryMin !== undefined && body.salaryMax !== undefined && body.salaryMin > body.salaryMax) {
      throw AppError.badRequest("salaryMin cannot exceed salaryMax.");
    }

    // Validate expiry date
    if (body.deadline && new Date(body.deadline) <= new Date()) {
      throw AppError.badRequest("Deadline must be a future date.");
    }

    // Auto-generate code if not provided or check uniqueness
    let code = body.code;
    if (!code) {
      code = await generateJobCode(tenantId);
    } else {
      const existing = await prisma.job.findFirst({ where: { tenantId, code } });
      if (existing) {
        throw AppError.conflict("Job code already exists for this tenant.", "DUPLICATE_JOB_CODE");
      }
    }

    const job = await JobRepository.create(tenantId, {
      ...body,
      code,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
    });

    await JobRepository.recordStatusChange(tenantId, job.id, null, "DRAFT", performedById, "Job created");

    await domainEventBus.publish(new JobCreatedEvent(tenantId, job.id, job.title, job.companyId, performedById));

    return job;
  },

  // ── Update Job ───────────────────────────────────────────────────────────────

  async updateJob(
    tenantId: string,
    jobId: string,
    body: {
      title?:        string;
      description?:  string;
      location?:     string;
      jobType?:      string;
      urgency?:      string;
      salaryBand?:   string;
      salaryMin?:    number;
      salaryMax?:    number;
      currency?:     string;
      minExperience?: number;
      maxExperience?: number;
      jdText?:       string;
      openingsCount?: number;
      deadline?:     string;
      tags?:         string[];
      departments?:  string[];
      skills?:       Array<{ name: string; isRequired?: boolean }>;
    },
    performedById: string,
  ) {
    const existing = await JobRepository.findById(tenantId, jobId);
    if (!existing) throw AppError.notFound("Job not found.");

    if (existing.status === "CLOSED" || existing.status === "CANCELLED") {
      throw AppError.badRequest(`Cannot update a job with status ${existing.status}.`);
    }

    if (body.salaryMin !== undefined && body.salaryMax !== undefined && body.salaryMin > body.salaryMax) {
      throw AppError.badRequest("salaryMin cannot exceed salaryMax.");
    }

    if (body.deadline && new Date(body.deadline) <= new Date()) {
      throw AppError.badRequest("Deadline must be a future date.");
    }

    // Build change diff for audit
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    const trackable = ["title", "description", "location", "jobType", "urgency", "salaryMin", "salaryMax", "minExperience", "maxExperience", "deadline"] as const;
    for (const key of trackable) {
      if (body[key] !== undefined && (existing as any)[key] !== body[key]) {
        changes[key] = { old: (existing as any)[key], new: body[key] };
      }
    }

    const { tags, departments, skills, urgency, ...coreData } = body;

    const updated = await JobRepository.update(tenantId, jobId, {
      ...coreData,
      urgency: urgency as any,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      tags,
      departments,
      skills,
    });

    if (Object.keys(changes).length > 0) {
      await domainEventBus.publish(new JobUpdatedEvent(tenantId, jobId, changes, performedById));
    }

    return updated;
  },

  // ── Submit for Approval ──────────────────────────────────────────────────────

  async submitForApproval(tenantId: string, jobId: string, performedById: string) {
    const job = await JobRepository.findById(tenantId, jobId);
    if (!job) throw AppError.notFound("Job not found.");
    if (job.status !== "DRAFT") throw AppError.badRequest("Only DRAFT jobs can be submitted for approval.");

    const updated = await prisma.job.update({
      where: { id: jobId },
      data:  { status: "PENDING_APPROVAL" },
    });

    await JobRepository.recordStatusChange(tenantId, jobId, "DRAFT", "PENDING_APPROVAL", performedById);
    await domainEventBus.publish(new JobUpdatedEvent(tenantId, jobId, { status: { old: "DRAFT", new: "PENDING_APPROVAL" } }, performedById));

    return updated;
  },

  // ── Approve Job ──────────────────────────────────────────────────────────────

  async approveJob(tenantId: string, jobId: string, performedById: string) {
    const job = await JobRepository.findById(tenantId, jobId);
    if (!job) throw AppError.notFound("Job not found.");
    if (job.status !== "PENDING_APPROVAL") throw AppError.badRequest("Only PENDING_APPROVAL jobs can be approved.");

    const updated = await prisma.job.update({
      where: { id: jobId },
      data:  { status: "OPEN", approvedById: performedById, approvedAt: new Date() },
    });

    await JobRepository.recordStatusChange(tenantId, jobId, "PENDING_APPROVAL", "OPEN", performedById);
    await domainEventBus.publish(new JobApprovedEvent(tenantId, jobId, performedById));

    return updated;
  },

  // ── Close Job ────────────────────────────────────────────────────────────────

  async closeJob(tenantId: string, jobId: string, reason: string | undefined, performedById: string) {
    const job = await JobRepository.findById(tenantId, jobId);
    if (!job) throw AppError.notFound("Job not found.");
    if (job.status === "CLOSED" || job.status === "CANCELLED") {
      throw AppError.badRequest(`Job is already ${job.status}.`);
    }

    const oldStatus = job.status;
    const updated   = await prisma.job.update({
      where: { id: jobId },
      data:  { status: "CLOSED", isActive: false },
    });

    await JobRepository.recordStatusChange(tenantId, jobId, oldStatus, "CLOSED", performedById, reason);
    await domainEventBus.publish(new JobClosedEvent(tenantId, jobId, reason, performedById));

    return updated;
  },

  // ── Reopen Job ───────────────────────────────────────────────────────────────

  async reopenJob(tenantId: string, jobId: string, performedById: string) {
    const job = await JobRepository.findById(tenantId, jobId, true);
    if (!job) throw AppError.notFound("Job not found.");
    if (job.status !== "CLOSED" && job.status !== "ON_HOLD") {
      throw AppError.badRequest("Only CLOSED or ON_HOLD jobs can be reopened.");
    }

    const oldStatus = job.status;
    const updated   = await prisma.job.update({
      where: { id: jobId },
      data:  { status: "OPEN", isActive: true },
    });

    await JobRepository.recordStatusChange(tenantId, jobId, oldStatus, "OPEN", performedById, "Job reopened");
    await domainEventBus.publish(new JobOpenedEvent(tenantId, jobId, performedById));

    return updated;
  },

  // ── Archive / Restore ────────────────────────────────────────────────────────

  async archiveJob(tenantId: string, jobId: string, performedById: string) {
    const job = await JobRepository.findById(tenantId, jobId);
    if (!job) throw AppError.notFound("Job not found.");

    // Guard: cannot archive an open job with active pipelines
    const activePipelines = await prisma.candidatePipeline.count({
      where: { jobId, tenantId, stage: { notIn: ["REJECTED", "DROPPED", "POST_JOINING"] } },
    });
    if (activePipelines > 0) {
      throw AppError.conflict("Cannot archive a job with active candidates in pipeline.", "JOB_HAS_ACTIVE_PIPELINE");
    }

    const updated = await JobRepository.archive(tenantId, jobId);
    await JobRepository.recordStatusChange(tenantId, jobId, job.status, "ARCHIVED", performedById);
    await domainEventBus.publish(new JobArchivedEvent(tenantId, jobId, performedById));

    return updated;
  },

  async restoreJob(tenantId: string, jobId: string, performedById: string) {
    const job = await JobRepository.findById(tenantId, jobId, true);
    if (!job) throw AppError.notFound("Job not found.");
    if (!job.archivedAt) throw AppError.badRequest("Job is not archived.");

    const updated = await JobRepository.restore(tenantId, jobId);
    await JobRepository.recordStatusChange(tenantId, jobId, "ARCHIVED", "OPEN", performedById, "Job restored from archive");
    await domainEventBus.publish(new JobRestoredEvent(tenantId, jobId, performedById));

    return updated;
  },

  async permanentDeleteJob(tenantId: string, jobId: string) {
    const job = await JobRepository.findByIdIncludeDeleted(tenantId, jobId);
    if (!job) throw AppError.notFound("Job not found.");
    await JobRepository.permanentDelete(tenantId, jobId);
  },

  // ── Recruiter Assignment ─────────────────────────────────────────────────────

  async assignRecruiter(
    tenantId: string,
    jobId: string,
    userId: string,
    isLead: boolean,
    performedById: string,
  ) {
    const job = await JobRepository.findById(tenantId, jobId);
    if (!job) throw AppError.notFound("Job not found.");

    const assignment = await prisma.jobRecruiterAssignment.upsert({
      where:  { tenantId_jobId_userId: { tenantId, jobId, userId } },
      create: { tenantId, jobId, userId, isLead, assignedById: performedById },
      update: { isLead },
    });

    await domainEventBus.publish(new JobAssignedEvent(tenantId, jobId, userId, "RECRUITER", isLead, performedById));
    return assignment;
  },

  async removeRecruiter(tenantId: string, jobId: string, userId: string) {
    return prisma.jobRecruiterAssignment.deleteMany({ where: { tenantId, jobId, userId } });
  },

  // ── Hiring Manager Assignment ────────────────────────────────────────────────

  async assignHiringManager(
    tenantId: string,
    jobId: string,
    userId: string,
    performedById: string,
  ) {
    const job = await JobRepository.findById(tenantId, jobId);
    if (!job) throw AppError.notFound("Job not found.");

    const assignment = await prisma.jobHiringManagerAssignment.upsert({
      where:  { tenantId_jobId_userId: { tenantId, jobId, userId } },
      create: { tenantId, jobId, userId, assignedById: performedById },
      update: { assignedById: performedById },
    });

    await domainEventBus.publish(new JobAssignedEvent(tenantId, jobId, userId, "HIRING_MANAGER", false, performedById));
    return assignment;
  },

  async removeHiringManager(tenantId: string, jobId: string, userId: string) {
    return prisma.jobHiringManagerAssignment.deleteMany({ where: { tenantId, jobId, userId } });
  },

  // ── Clone / Duplicate ────────────────────────────────────────────────────────

  async cloneJob(tenantId: string, sourceJobId: string, performedById: string, overrides?: { title?: string; code?: string }) {
    const source = await JobRepository.findById(tenantId, sourceJobId);
    if (!source) throw AppError.notFound("Source job not found.");

    const code  = overrides?.code ?? await generateJobCode(tenantId);
    const title = overrides?.title ?? `[COPY] ${source.title}`;

    const newJob = await JobRepository.create(tenantId, {
      companyId:     source.companyId,
      code,
      title,
      description:   source.description ?? undefined,
      location:      source.location,
      jobType:       source.jobType,
      urgency:       source.urgency,
      salaryBand:    source.salaryBand ?? undefined,
      salaryMin:     source.salaryMin ?? undefined,
      salaryMax:     source.salaryMax ?? undefined,
      currency:      source.currency,
      minExperience: source.minExperience ?? undefined,
      maxExperience: source.maxExperience ?? undefined,
      jdText:        source.jdText ?? undefined,
      openingsCount: source.openingsCount,
      departments:   source.departments.map((d) => d.name),
      locations:     source.locations.map((l) => ({ city: l.city, state: l.state ?? undefined, country: l.country })),
      requirements:  source.requirements.map((r) => ({ description: r.description, isRequired: r.isRequired })),
      skills:        source.skills.map((s) => ({ name: s.name, isRequired: s.isRequired })),
      questions:     source.questions.map((q) => ({ questionText: q.questionText, questionType: q.questionType, options: q.options, isRequired: q.isRequired })),
      tags:          source.tags.map((t) => t.name),
    });

    await JobRepository.recordStatusChange(tenantId, newJob.id, null, "DRAFT", performedById, `Cloned from job ${sourceJobId}`);
    await domainEventBus.publish(new JobClonedEvent(tenantId, sourceJobId, newJob.id, performedById));

    return newJob;
  },

  // ── Add Document ─────────────────────────────────────────────────────────────

  async addDocument(
    tenantId: string,
    jobId: string,
    data: { name: string; documentType: string; fileUrl: string; fileKey?: string; fileSize?: number },
  ) {
    const job = await JobRepository.findById(tenantId, jobId);
    if (!job) throw AppError.notFound("Job not found.");
    return prisma.jobDocument.create({ data: { tenantId, jobId, ...data } });
  },

  async getDocuments(tenantId: string, jobId: string) {
    return prisma.jobDocument.findMany({ where: { tenantId, jobId } });
  },

  // ── Timeline ─────────────────────────────────────────────────────────────────

  async getTimeline(tenantId: string, jobId: string) {
    return JobRepository.findTimeline(tenantId, jobId);
  },

  // ── Metrics ──────────────────────────────────────────────────────────────────

  async getMetrics(tenantId: string) {
    return JobRepository.getMetrics(tenantId);
  },

  // ── Saved Filters ─────────────────────────────────────────────────────────────

  async saveFilter(tenantId: string, userId: string, name: string, filters: object) {
    return JobRepository.saveFilter(tenantId, userId, name, filters);
  },

  async getFilters(tenantId: string, userId: string) {
    return JobRepository.getFilters(tenantId, userId);
  },
};
