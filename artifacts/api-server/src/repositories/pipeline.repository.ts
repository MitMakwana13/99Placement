import { prisma } from "@workspace/db-prisma";
import { Prisma, PipelineStage } from "@prisma/client";
import { AppError } from "../utils/app-error";

export interface PipelineFilters {
  candidateId?:        string;
  jobId?:              string;
  stage?:              PipelineStage;
  assignedRecruiterId?: string;
  search?:             string;
}

export interface PaginationOptions {
  limit?:     number;
  cursor?:    string;
  sortBy?:    string;
  sortOrder?: "asc" | "desc";
}

const PIPELINE_FULL_INCLUDE = {
  candidate:         true,
  job:               true,
  assignedRecruiter: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  pipelineNotes: {
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" as const },
  },
  attachments: {
    include: {
      uploadedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { uploadedAt: "desc" as const },
  },
  ratings: {
    include: {
      ratedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { updatedAt: "desc" as const },
  },
  checklists: {
    include: {
      completedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { title: "asc" as const },
  },
  reminders: {
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
    orderBy: { remindAt: "asc" as const },
  },
  activities: {
    include: {
      performedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" as const },
  },
  tags: {
    orderBy: { name: "asc" as const },
  },
  histories: {
    include: {
      changedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { changedAt: "desc" as const },
  },
} as const;

export const PipelineRepository = {

  // ── Create (Add Candidate to Job) ──────────────────────────────────────────

  async create(
    tenantId: string,
    data: {
      candidateId:        string;
      jobId:              string;
      stage?:             PipelineStage;
      assignedRecruiterId?: string;
      notes?:             string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      // Uniqueness check: is candidate already in this job's active pipeline?
      const existing = await tx.candidatePipeline.findFirst({
        where: {
          tenantId,
          candidateId: data.candidateId,
          jobId:       data.jobId,
          deletedAt:   null,
        },
      });

      if (existing) {
        throw new AppError("Candidate is already active in the pipeline for this job.", 409);
      }

      const pipeline = await tx.candidatePipeline.create({
        data: {
          tenantId,
          candidateId:        data.candidateId,
          jobId:              data.jobId,
          stage:              data.stage ?? PipelineStage.SOURCED,
          assignedRecruiterId: data.assignedRecruiterId,
          notes:              data.notes,
        },
        include: PIPELINE_FULL_INCLUDE,
      });

      // Write initial stage to history
      await tx.pipelineHistory.create({
        data: {
          tenantId,
          pipelineId: pipeline.id,
          newStage:   pipeline.stage,
          reason:     "Initial stage placement",
        },
      });

      return pipeline;
    });
  },

  // ── Find By ID ─────────────────────────────────────────────────────────────

  async findById(tenantId: string, id: string) {
    const pipeline = await prisma.candidatePipeline.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: PIPELINE_FULL_INCLUDE,
    });

    if (!pipeline) {
      throw new AppError("Candidate pipeline connection not found.", 404);
    }

    return pipeline;
  },

  // ── Find Many (Paginated) ──────────────────────────────────────────────────

  async findMany(
    tenantId: string,
    filters: PipelineFilters = {},
    options: PaginationOptions = {},
  ) {
    const limit = options.limit ?? 20;
    const sortBy = options.sortBy ?? "createdAt";
    const sortOrder = options.sortOrder ?? "desc";

    const where: Prisma.CandidatePipelineWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (filters.candidateId) {
      where.candidateId = filters.candidateId;
    }
    if (filters.jobId) {
      where.jobId = filters.jobId;
    }
    if (filters.stage) {
      where.stage = filters.stage;
    }
    if (filters.assignedRecruiterId) {
      where.assignedRecruiterId = filters.assignedRecruiterId;
    }
    if (filters.search) {
      where.candidate = {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
        ],
      };
    }

    const items = await prisma.candidatePipeline.findMany({
      where,
      take: limit + 1,
      cursor: options.cursor ? { id: options.cursor } : undefined,
      orderBy: { [sortBy]: sortOrder },
      include: PIPELINE_FULL_INCLUDE,
    });

    let nextCursor: string | undefined = undefined;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem?.id;
    }

    return {
      items,
      nextCursor,
    };
  },

  // ── Stage Transition ───────────────────────────────────────────────────────

  async updateStage(
    tenantId: string,
    id: string,
    data: {
      newStage:      PipelineStage;
      reason?:       string;
      performedById: string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const pipeline = await tx.candidatePipeline.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!pipeline) {
        throw new AppError("Pipeline record not found.", 404);
      }

      if (pipeline.stage === data.newStage) {
        return pipeline;
      }

      // Update stage
      const updated = await tx.candidatePipeline.update({
        where: { id },
        data: {
          stage:          data.newStage,
          stageUpdatedAt: new Date(),
        },
        include: PIPELINE_FULL_INCLUDE,
      });

      // Write transition history
      await tx.pipelineHistory.create({
        data: {
          tenantId,
          pipelineId:  id,
          oldStage:    pipeline.stage,
          newStage:    data.newStage,
          reason:      data.reason,
          changedById: data.performedById,
        },
      });

      return updated;
    });
  },

  // ── Bulk Stage Move ────────────────────────────────────────────────────────

  async bulkUpdateStage(
    tenantId: string,
    ids: string[],
    data: {
      newStage:      PipelineStage;
      reason?:       string;
      performedById: string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const pipelines = await tx.candidatePipeline.findMany({
        where: {
          id: { in: ids },
          tenantId,
          deletedAt: null,
        },
      });

      const updatedIds: string[] = [];
      const updatedRecords: any[] = [];

      for (const p of pipelines) {
        if (p.stage === data.newStage) {
          continue;
        }

        const updated = await tx.candidatePipeline.update({
          where: { id: p.id },
          data: {
            stage:          data.newStage,
            stageUpdatedAt: new Date(),
          },
          include: PIPELINE_FULL_INCLUDE,
        });

        await tx.pipelineHistory.create({
          data: {
            tenantId,
            pipelineId:  p.id,
            oldStage:    p.stage,
            newStage:    data.newStage,
            reason:      data.reason,
            changedById: data.performedById,
          },
        });

        updatedIds.push(p.id);
        updatedRecords.push(updated);
      }

      return {
        updatedCount: updatedIds.length,
        items:        updatedRecords,
      };
    });
  },

  // ── Soft Delete ────────────────────────────────────────────────────────────

  async softDelete(tenantId: string, id: string) {
    const pipeline = await prisma.candidatePipeline.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!pipeline) {
      throw new AppError("Pipeline record not found.", 404);
    }

    return prisma.candidatePipeline.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: PIPELINE_FULL_INCLUDE,
    });
  },

  // ── Restore ────────────────────────────────────────────────────────────────

  async restore(tenantId: string, id: string) {
    const pipeline = await prisma.candidatePipeline.findFirst({
      where: { id, tenantId, NOT: { deletedAt: null } },
    });

    if (!pipeline) {
      throw new AppError("Deleted pipeline record not found.", 404);
    }

    return prisma.candidatePipeline.update({
      where: { id },
      data: { deletedAt: null },
      include: PIPELINE_FULL_INCLUDE,
    });
  },

  // ── Permanent Delete ───────────────────────────────────────────────────────

  async permanentDelete(tenantId: string, id: string) {
    const pipeline = await prisma.candidatePipeline.findFirst({
      where: { id, tenantId },
    });

    if (!pipeline) {
      throw new AppError("Pipeline record not found.", 404);
    }

    await prisma.candidatePipeline.delete({
      where: { id },
    });

    return true;
  },

  // ── Sub-resource: Pipeline Note CRUD ───────────────────────────────────────

  async createNote(
    tenantId: string,
    pipelineId: string,
    data: {
      authorId:  string;
      content:   string;
      isPrivate?: boolean;
    },
  ) {
    return prisma.pipelineNote.create({
      data: {
        tenantId,
        pipelineId,
        authorId:  data.authorId,
        content:   data.content,
        isPrivate: data.isPrivate ?? false,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });
  },

  async deleteNote(tenantId: string, noteId: string) {
    const note = await prisma.pipelineNote.findFirst({
      where: { id: noteId, tenantId },
    });

    if (!note) {
      throw new AppError("Pipeline note not found.", 404);
    }

    await prisma.pipelineNote.delete({
      where: { id: noteId },
    });

    return true;
  },

  // ── Sub-resource: Attachment CRUD ──────────────────────────────────────────

  async createAttachment(
    tenantId: string,
    pipelineId: string,
    data: {
      name:         string;
      fileUrl:      string;
      fileKey?:     string;
      fileSize?:    number;
      uploadedById?: string;
    },
  ) {
    return prisma.pipelineAttachment.create({
      data: {
        tenantId,
        pipelineId,
        name:         data.name,
        fileUrl:      data.fileUrl,
        fileKey:      data.fileKey,
        fileSize:     data.fileSize,
        uploadedById: data.uploadedById,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
    });
  },

  async deleteAttachment(tenantId: string, attachmentId: string) {
    const attachment = await prisma.pipelineAttachment.findFirst({
      where: { id: attachmentId, tenantId },
    });

    if (!attachment) {
      throw new AppError("Pipeline attachment not found.", 404);
    }

    await prisma.pipelineAttachment.delete({
      where: { id: attachmentId },
    });

    return true;
  },

  // ── Sub-resource: Rating Operations ────────────────────────────────────────

  async updateRating(
    tenantId: string,
    pipelineId: string,
    data: {
      ratedById:       string;
      recruiterRating?: number;
      technicalRating?: number;
      hrRating?:        number;
      overallRating?:   number;
      feedback?:       string;
    },
  ) {
    return prisma.pipelineRating.create({
      data: {
        tenantId,
        pipelineId,
        ratedById:       data.ratedById,
        recruiterRating: data.recruiterRating,
        technicalRating: data.technicalRating,
        hrRating:        data.hrRating,
        overallRating:   data.overallRating,
        feedback:        data.feedback,
      },
      include: {
        ratedBy: {
          select: { id: true, name: true },
        },
      },
    });
  },

  // ── Sub-resource: Checklist Operations ─────────────────────────────────────

  async createChecklistItems(
    tenantId: string,
    pipelineId: string,
    items: Array<{ itemKey: string; title: string; isCompleted?: boolean }>,
  ) {
    const created: any[] = [];
    for (const item of items) {
      const dbItem = await prisma.pipelineChecklist.upsert({
        where: {
          tenantId_pipelineId_itemKey: {
            tenantId,
            pipelineId,
            itemKey: item.itemKey,
          },
        },
        create: {
          tenantId,
          pipelineId,
          itemKey:     item.itemKey,
          title:       item.title,
          isCompleted: item.isCompleted ?? false,
        },
        update: {},
      });
      created.push(dbItem);
    }
    return created;
  },

  async updateChecklistItem(
    tenantId: string,
    pipelineId: string,
    itemKey: string,
    data: {
      isCompleted:   boolean;
      completedById?: string;
    },
  ) {
    return prisma.pipelineChecklist.update({
      where: {
        tenantId_pipelineId_itemKey: {
          tenantId,
          pipelineId,
          itemKey,
        },
      },
      data: {
        isCompleted:   data.isCompleted,
        completedById: data.isCompleted ? data.completedById : null,
        completedAt:   data.isCompleted ? new Date() : null,
      },
    });
  },

  // ── Sub-resource: Reminders Operations ─────────────────────────────────────

  async createReminder(
    tenantId: string,
    pipelineId: string,
    data: {
      userId:       string;
      title:        string;
      description?:  string;
      reminderType: string;
      remindAt:     Date;
    },
  ) {
    return prisma.pipelineReminder.create({
      data: {
        tenantId,
        pipelineId,
        userId:       data.userId,
        title:        data.title,
        description:  data.description,
        reminderType: data.reminderType,
        remindAt:     data.remindAt,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });
  },

  async updateReminderCompletion(tenantId: string, reminderId: string, isCompleted: boolean) {
    const reminder = await prisma.pipelineReminder.findFirst({
      where: { id: reminderId, tenantId },
    });

    if (!reminder) {
      throw new AppError("Reminder not found.", 404);
    }

    return prisma.pipelineReminder.update({
      where: { id: reminderId },
      data: { isCompleted },
    });
  },

  // ── Metrics & Performance Calculations ─────────────────────────────────────

  async getCandidatesPerStage(tenantId: string) {
    const counts = await prisma.candidatePipeline.groupBy({
      by: ["stage"],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
    });

    const result: Record<string, number> = {};
    for (const item of counts) {
      result[item.stage] = item._count.id;
    }
    return result;
  },

  async getAverageStageDuration(tenantId: string) {
    // Queries all pipeline histories to calculate how long candidates stayed in stages.
    const histories = await prisma.pipelineHistory.findMany({
      where: { tenantId },
      orderBy: { changedAt: "asc" },
    });

    const pipelineStageDurations: Record<string, { totalDurationMs: number; count: number }> = {};

    // Group history entries by pipelineId
    const pipelineHistories: Record<string, typeof histories> = {};
    for (const h of histories) {
      if (!pipelineHistories[h.pipelineId]) {
        pipelineHistories[h.pipelineId] = [];
      }
      pipelineHistories[h.pipelineId].push(h);
    }

    for (const pipelineId in pipelineHistories) {
      const historyList = pipelineHistories[pipelineId];
      for (let i = 0; i < historyList.length - 1; i++) {
        const current = historyList[i];
        const next = historyList[i + 1];

        // The stage is newStage
        const stage = current.newStage;
        const duration = next.changedAt.getTime() - current.changedAt.getTime();

        if (!pipelineStageDurations[stage]) {
          pipelineStageDurations[stage] = { totalDurationMs: 0, count: 0 };
        }
        pipelineStageDurations[stage].totalDurationMs += duration;
        pipelineStageDurations[stage].count += 1;
      }
    }

    const averages: Record<string, number> = {};
    for (const stage in pipelineStageDurations) {
      const stats = pipelineStageDurations[stage];
      // Convert milliseconds to days
      const avgDays = stats.totalDurationMs / (1000 * 60 * 60 * 24) / stats.count;
      averages[stage] = parseFloat(avgDays.toFixed(2));
    }

    return averages;
  },

  async getConversionRate(tenantId: string) {
    const total = await prisma.candidatePipeline.count({
      where: { tenantId, deletedAt: null },
    });

    if (total === 0) return 0;

    const hired = await prisma.candidatePipeline.count({
      where: { tenantId, stage: PipelineStage.JOINING, deletedAt: null },
    });

    return parseFloat(((hired / total) * 100).toFixed(2));
  },

  async getDropOffRate(tenantId: string) {
    const total = await prisma.candidatePipeline.count({
      where: { tenantId, deletedAt: null },
    });

    if (total === 0) return 0;

    const dropped = await prisma.candidatePipeline.count({
      where: {
        tenantId,
        stage: { in: [PipelineStage.REJECTED, PipelineStage.DROPPED] },
        deletedAt: null,
      },
    });

    return parseFloat(((dropped / total) * 100).toFixed(2));
  },

  async getRecruiterPerformance(tenantId: string) {
    const stats = await prisma.candidatePipeline.groupBy({
      by: ["assignedRecruiterId"],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
    });

    const recruiters = await prisma.user.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });

    const recruiterMap = new Map(recruiters.map(r => [r.id, r.name]));

    return stats.map(item => {
      const recruiterId = item.assignedRecruiterId;
      return {
        recruiterId,
        recruiterName: recruiterId ? (recruiterMap.get(recruiterId) ?? "Unknown") : "Unassigned",
        candidatesCount: item._count.id,
      };
    });
  },

  async getPipelineHealth(tenantId: string) {
    // Pipeline health is defined by identifying "stale" candidate pipeline connections.
    // E.g., candidates that haven't had their stage updated in the last 14 days.
    const staleThreshold = new Date();
    staleThreshold.setDate(staleThreshold.getDate() - 14);

    const staleCount = await prisma.candidatePipeline.count({
      where: {
        tenantId,
        deletedAt: null,
        stageUpdatedAt: { lt: staleThreshold },
        NOT: {
          stage: { in: [PipelineStage.JOINING, PipelineStage.REJECTED, PipelineStage.DROPPED] },
        },
      },
    });

    const activeCount = await prisma.candidatePipeline.count({
      where: {
        tenantId,
        deletedAt: null,
        NOT: {
          stage: { in: [PipelineStage.JOINING, PipelineStage.REJECTED, PipelineStage.DROPPED] },
        },
      },
    });

    return {
      activeCandidates: activeCount,
      staleCandidates:  staleCount,
      healthScore:      activeCount === 0 ? 100 : parseFloat((((activeCount - staleCount) / activeCount) * 100).toFixed(2)),
    };
  },

};
