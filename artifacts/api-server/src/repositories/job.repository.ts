import { prisma } from "@workspace/db-prisma";
import { Prisma } from "@workspace/db-prisma";
import { AppError } from "../utils/app-error";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JobFilters {
  search?:          string;
  companyId?:       string;
  recruiterId?:     string;
  hiringManagerId?: string;
  status?:          string;
  jobType?:         string;
  urgency?:         string;
  minSalary?:       number;
  maxSalary?:       number;
  minExperience?:   number;
  maxExperience?:   number;
  expiryBefore?:    string;
  expiryAfter?:     string;
  tags?:            string[];
  skills?:          string[];
}

export interface PaginationOptions {
  limit?:    number;
  cursor?:   string;
  sortBy?:   string;
  sortOrder?: "asc" | "desc";
}

const JOB_FULL_INCLUDE = {
  company:        true,
  departments:    true,
  locations:      true,
  requirements:   true,
  skills:         true,
  questions:      true,
  tags:           true,
  documents:      true,
  recruiters:     { include: { user: true } },
  hiringManagers: { include: { user: true } },
  statusHistory:  { orderBy: { changedAt: "desc" as const } },
  approvedBy:     true,
} as const;

// ── Repository ────────────────────────────────────────────────────────────────

export const JobRepository = {

  // ── Create ──────────────────────────────────────────────────────────────────

  async create(
    tenantId: string,
    data: {
      companyId:     string;
      code:          string;
      title:         string;
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
      deadline?:     Date;
      departments?:  string[];
      locations?:    Array<{ city: string; state?: string; country?: string }>;
      requirements?: Array<{ description: string; isRequired?: boolean }>;
      skills?:       Array<{ name: string; isRequired?: boolean }>;
      questions?:    Array<{ questionText: string; questionType?: string; options?: string[]; isRequired?: boolean }>;
      tags?:         string[];
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          tenantId,
          companyId:    data.companyId,
          code:         data.code,
          title:        data.title,
          description:  data.description,
          location:     data.location,
          jobType:      data.jobType ?? "full_time",
          urgency:      (data.urgency as any) ?? "NORMAL",
          salaryBand:   data.salaryBand,
          salaryMin:    data.salaryMin,
          salaryMax:    data.salaryMax,
          currency:     data.currency ?? "INR",
          minExperience: data.minExperience,
          maxExperience: data.maxExperience,
          jdText:       data.jdText,
          openingsCount: data.openingsCount ?? 1,
          deadline:     data.deadline,
          status:       "DRAFT",
        },
      });

      if (data.departments?.length) {
        await tx.jobDepartment.createMany({
          data: data.departments.map((name) => ({ tenantId, jobId: job.id, name })),
          skipDuplicates: true,
        });
      }

      if (data.locations?.length) {
        await tx.jobLocation.createMany({
          data: data.locations.map((l) => ({
            tenantId, jobId: job.id,
            city: l.city, state: l.state, country: l.country ?? "India",
          })),
        });
      }

      if (data.requirements?.length) {
        await tx.jobRequirement.createMany({
          data: data.requirements.map((r) => ({
            tenantId, jobId: job.id,
            description: r.description,
            isRequired:  r.isRequired ?? true,
          })),
        });
      }

      if (data.skills?.length) {
        await tx.jobSkill.createMany({
          data: data.skills.map((s) => ({
            tenantId, jobId: job.id,
            name: s.name, isRequired: s.isRequired ?? true,
          })),
          skipDuplicates: true,
        });
      }

      if (data.questions?.length) {
        await tx.jobQuestion.createMany({
          data: data.questions.map((q) => ({
            tenantId, jobId: job.id,
            questionText: q.questionText,
            questionType: q.questionType ?? "TEXT",
            options:      q.options ?? [],
            isRequired:   q.isRequired ?? false,
          })),
        });
      }

      if (data.tags?.length) {
        await tx.jobTag.createMany({
          data: data.tags.map((name) => ({ tenantId, jobId: job.id, name })),
          skipDuplicates: true,
        });
      }

      return job;
    });
  },

  // ── Find by ID ──────────────────────────────────────────────────────────────

  async findById(tenantId: string, jobId: string, includeArchived = false) {
    const where: Prisma.JobWhereInput = {
      id:       jobId,
      tenantId,
      deletedAt: null,
      ...(!includeArchived ? { archivedAt: null } : {}),
    };
    return prisma.job.findFirst({ where, include: JOB_FULL_INCLUDE });
  },

  async findByIdIncludeDeleted(tenantId: string, jobId: string) {
    return prisma.job.findFirst({
      where:   { id: jobId, tenantId },
      include: JOB_FULL_INCLUDE,
    });
  },

  // ── Find Many (paginated + filters) ─────────────────────────────────────────

  async findManyPaginated(
    tenantId: string,
    filters: JobFilters,
    opts: PaginationOptions,
  ) {
    const limit    = Math.min(opts.limit ?? 20, 100);
    const sortBy   = opts.sortBy ?? "createdAt";
    const sortOrder = opts.sortOrder ?? "desc";

    const where: Prisma.JobWhereInput = {
      tenantId,
      deletedAt:  null,
      archivedAt: null,
      ...(filters.companyId ? { companyId: filters.companyId } : {}),
      ...(filters.recruiterId ? { recruiterId: filters.recruiterId } : {}),
      ...(filters.status ? { status: filters.status as any } : {}),
      ...(filters.jobType ? { jobType: filters.jobType } : {}),
      ...(filters.urgency ? { urgency: filters.urgency as any } : {}),
      ...(filters.minSalary !== undefined ? { salaryMin: { gte: filters.minSalary } } : {}),
      ...(filters.maxSalary !== undefined ? { salaryMax: { lte: filters.maxSalary } } : {}),
      ...(filters.minExperience !== undefined ? { minExperience: { gte: filters.minExperience } } : {}),
      ...(filters.maxExperience !== undefined ? { maxExperience: { lte: filters.maxExperience } } : {}),
      ...(filters.expiryBefore ? { deadline: { lte: new Date(filters.expiryBefore) } } : {}),
      ...(filters.expiryAfter  ? { deadline: { gte: new Date(filters.expiryAfter)  } } : {}),
      ...(filters.hiringManagerId ? {
        hiringManagers: { some: { userId: filters.hiringManagerId } },
      } : {}),
      ...(filters.skills?.length ? {
        skills: { some: { name: { in: filters.skills } } },
      } : {}),
      ...(filters.tags?.length ? {
        tags: { some: { name: { in: filters.tags } } },
      } : {}),
      ...(filters.search ? {
        OR: [
          { title:       { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
          { code:        { contains: filters.search, mode: "insensitive" } },
          { jdText:      { contains: filters.search, mode: "insensitive" } },
        ],
      } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.job.findMany({
        where,
        take:    limit + 1,
        ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
        orderBy: { [sortBy]: sortOrder },
        include: {
          company:        { select: { id: true, name: true } },
          departments:    true,
          locations:      true,
          skills:         true,
          tags:           true,
          recruiters:     { include: { user: { select: { id: true, name: true } } } },
          hiringManagers: { include: { user: { select: { id: true, name: true } } } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    const hasNextPage = data.length > limit;
    const items       = hasNextPage ? data.slice(0, limit) : data;
    const nextCursor  = hasNextPage ? items[items.length - 1]?.id : undefined;

    return { data: items, total, hasNextPage, nextCursor };
  },

  // ── Update ──────────────────────────────────────────────────────────────────

  async update(
    tenantId: string,
    jobId: string,
    data: Prisma.JobUpdateInput & {
      tags?:         string[];
      departments?:  string[];
      skills?:       Array<{ name: string; isRequired?: boolean }>;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const { tags, departments, skills, ...coreData } = data;

      const job = await tx.job.update({
        where: { id: jobId },
        data:  coreData,
      });

      if (tags !== undefined) {
        await tx.jobTag.deleteMany({ where: { jobId, tenantId } });
        if (tags.length) {
          await tx.jobTag.createMany({
            data: tags.map((name) => ({ tenantId, jobId, name })),
            skipDuplicates: true,
          });
        }
      }

      if (departments !== undefined) {
        await tx.jobDepartment.deleteMany({ where: { jobId, tenantId } });
        if (departments.length) {
          await tx.jobDepartment.createMany({
            data: departments.map((name) => ({ tenantId, jobId, name })),
            skipDuplicates: true,
          });
        }
      }

      if (skills !== undefined) {
        await tx.jobSkill.deleteMany({ where: { jobId, tenantId } });
        if (skills.length) {
          await tx.jobSkill.createMany({
            data: skills.map((s) => ({
              tenantId, jobId,
              name: s.name, isRequired: s.isRequired ?? true,
            })),
            skipDuplicates: true,
          });
        }
      }

      return job;
    });
  },

  // ── Status History ───────────────────────────────────────────────────────────

  async recordStatusChange(
    tenantId: string,
    jobId: string,
    oldStatus: string | null,
    newStatus: string,
    changedById: string,
    reason?: string,
  ) {
    return prisma.jobStatusHistory.create({
      data: { tenantId, jobId, oldStatus, newStatus, changedById, reason },
    });
  },

  async findStatusHistory(tenantId: string, jobId: string) {
    return prisma.jobStatusHistory.findMany({
      where:   { tenantId, jobId },
      orderBy: { changedAt: "desc" },
      include: { changedBy: { select: { id: true, name: true } } },
    });
  },

  // ── Saved Filters ────────────────────────────────────────────────────────────

  async saveFilter(tenantId: string, userId: string, name: string, filters: object) {
    return prisma.savedFilter.upsert({
      where:  { tenantId_userId_name: { tenantId, userId, name } },
      create: { tenantId, userId, name, filters, entityType: "JOB" },
      update: { filters },
    });
  },

  async getFilters(tenantId: string, userId: string) {
    return prisma.savedFilter.findMany({
      where:   { tenantId, userId, entityType: "JOB" },
      orderBy: { createdAt: "desc" },
    });
  },

  // ── Timeline ────────────────────────────────────────────────────────────────

  async findTimeline(tenantId: string, jobId: string) {
    return prisma.jobTimeline.findMany({
      where:   { tenantId, jobId },
      orderBy: { createdAt: "desc" },
    });
  },

  // ── Metrics ─────────────────────────────────────────────────────────────────

  async getMetrics(tenantId: string) {
    const [open, closed, draft, onHold, cancelled, archived, total] = await Promise.all([
      prisma.job.count({ where: { tenantId, status: "OPEN",      deletedAt: null } }),
      prisma.job.count({ where: { tenantId, status: "CLOSED",    deletedAt: null } }),
      prisma.job.count({ where: { tenantId, status: "DRAFT",     deletedAt: null } }),
      prisma.job.count({ where: { tenantId, status: "ON_HOLD",   deletedAt: null } }),
      prisma.job.count({ where: { tenantId, status: "CANCELLED", deletedAt: null } }),
      prisma.job.count({ where: { tenantId, status: "ARCHIVED",  deletedAt: null } }),
      prisma.job.count({ where: { tenantId,                       deletedAt: null } }),
    ]);

    const perRecruiter = await prisma.jobRecruiterAssignment.groupBy({
      by:     ["userId"],
      where:  { tenantId, job: { deletedAt: null, status: "OPEN" } },
      _count: { jobId: true },
    });

    return { open, closed, draft, onHold, cancelled, archived, total, perRecruiter };
  },

  // ── Soft Delete / Archive / Restore ─────────────────────────────────────────

  async softDelete(tenantId: string, jobId: string) {
    return prisma.job.update({
      where: { id: jobId },
      data:  { deletedAt: new Date(), isActive: false },
    });
  },

  async archive(tenantId: string, jobId: string) {
    return prisma.job.update({
      where: { id: jobId },
      data:  { archivedAt: new Date(), isActive: false, status: "ARCHIVED" },
    });
  },

  async restore(tenantId: string, jobId: string) {
    return prisma.job.update({
      where: { id: jobId },
      data:  { archivedAt: null, isActive: true, status: "OPEN" },
    });
  },

  async permanentDelete(tenantId: string, jobId: string) {
    await prisma.$transaction([
      prisma.jobTimeline.deleteMany({ where: { jobId } }),
      prisma.jobStatusHistory.deleteMany({ where: { jobId } }),
      prisma.jobDocument.deleteMany({ where: { jobId } }),
      prisma.jobQuestion.deleteMany({ where: { jobId } }),
      prisma.jobTag.deleteMany({ where: { jobId } }),
      prisma.jobSkill.deleteMany({ where: { jobId } }),
      prisma.jobRequirement.deleteMany({ where: { jobId } }),
      prisma.jobLocation.deleteMany({ where: { jobId } }),
      prisma.jobDepartment.deleteMany({ where: { jobId } }),
      prisma.jobRecruiterAssignment.deleteMany({ where: { jobId } }),
      prisma.jobHiringManagerAssignment.deleteMany({ where: { jobId } }),
      prisma.job.delete({ where: { id: jobId } }),
    ]);
  },
};
