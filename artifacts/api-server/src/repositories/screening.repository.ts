/**
 * Internal Screening Repository
 *
 * Handles all DB access for the 99 Placement internal screening workflow.
 * A screening interview is ALWAYS conducted before a candidate is sent to the client.
 */

import { prisma, Prisma } from "@workspace/db-prisma";
import { AppError } from "../utils/app-error";

// ── Scorecard Shape ───────────────────────────────────────────────────────────

export interface ScreeningScorecard {
  communicationScore?: number;
  technicalScore?: number;
  experienceScore?: number;
  salaryAlignScore?: number;
  noticePeriodScore?: number;
  personalityScore?: number;
}

// ── Standard Include ──────────────────────────────────────────────────────────

const SCREENING_INCLUDE = {
  interviewer: { select: { id: true, name: true, email: true } },
  criteriaScores: true,
  pipeline: {
    select: {
      id: true,
      stage: true,
      candidate: { select: { id: true, name: true, email: true, phone: true } },
      job: { select: { id: true, title: true, code: true } },
    },
  },
} satisfies Prisma.ScreeningInterviewInclude;

// ── Repository ────────────────────────────────────────────────────────────────

export const ScreeningRepository = {

  /**
   * Schedule a new screening interview.
   * Enforces: one active screening per pipeline.
   */
  async create(
    tenantId: string,
    data: {
      pipelineId: string;
      interviewerId: string;
      scheduledAt: Date;
      mode?: string;
    },
  ) {
    // Check for existing active screening on this pipeline
    const existing = await prisma.screeningInterview.findFirst({
      where: {
        tenantId,
        pipelineId: data.pipelineId,
        deletedAt: null,
        verdict: null, // no verdict means it's still pending
      },
    });

    if (existing) {
      throw new AppError(
        "An active screening interview already exists for this pipeline. Complete or cancel it first.",
        409,
      );
    }

    return prisma.screeningInterview.create({
      data: {
        tenantId,
        pipelineId: data.pipelineId,
        interviewerId: data.interviewerId,
        scheduledAt: data.scheduledAt,
        mode: data.mode ?? "phone",
      },
      include: SCREENING_INCLUDE,
    });
  },

  /**
   * Find a single screening by ID, scoped to tenant.
   */
  async findById(tenantId: string, id: string) {
    const record = await prisma.screeningInterview.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: SCREENING_INCLUDE,
    });

    if (!record) {
      throw new AppError("Screening interview not found.", 404);
    }

    return record;
  },

  /**
   * Find all screenings for a pipeline.
   */
  async findByPipeline(tenantId: string, pipelineId: string) {
    return prisma.screeningInterview.findMany({
      where: { tenantId, pipelineId, deletedAt: null },
      include: SCREENING_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Paginated list with filters.
   */
  async findMany(
    tenantId: string,
    filters: {
      interviewerId?: string;
      verdict?: string;
      fromDate?: Date;
      toDate?: Date;
    },
    options: { page?: number; pageSize?: number } = {},
  ) {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ScreeningInterviewWhereInput = {
      tenantId,
      deletedAt: null,
      ...(filters.interviewerId && { interviewerId: filters.interviewerId }),
      ...(filters.verdict && { verdict: filters.verdict as any }),
      ...(filters.fromDate && { scheduledAt: { gte: filters.fromDate } }),
      ...(filters.toDate && { scheduledAt: { lte: filters.toDate } }),
    };

    const [items, total] = await Promise.all([
      prisma.screeningInterview.findMany({
        where,
        include: SCREENING_INCLUDE,
        orderBy: { scheduledAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.screeningInterview.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  /**
   * Reschedule: update scheduledAt and interviewer.
   */
  async reschedule(
    tenantId: string,
    id: string,
    data: { scheduledAt: Date; interviewerId?: string; mode?: string },
  ) {
    await this.findById(tenantId, id); // existence + tenant check

    return prisma.screeningInterview.update({
      where: { id },
      data: {
        scheduledAt: data.scheduledAt,
        ...(data.interviewerId && { interviewerId: data.interviewerId }),
        ...(data.mode && { mode: data.mode }),
      },
      include: SCREENING_INCLUDE,
    });
  },

  /**
   * Record the scorecard and verdict (mark as conducted).
   * Computes overallScore as average of provided dimension scores.
   */
  async submitScorecard(
    tenantId: string,
    id: string,
    data: {
      scorecard: ScreeningScorecard;
      verdict: "SHORTLIST" | "HOLD" | "REJECT";
      recommendation?: string;
      notes?: string;
      conductedAt?: Date;
      currentCtcDisclosed?: number;
      expectedCtcDisclosed?: number;
      noticePeriodDays?: number;
      canJoinEarlier?: boolean;
      criteriaScores?: Array<{ criterion: string; score: number; notes?: string }>;
    },
  ) {
    await this.findById(tenantId, id);

    const scores = Object.values(data.scorecard).filter((v) => v !== undefined) as number[];
    const overallScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    // Map string verdict to Prisma enum value
    const verdictMap: Record<string, "SHORTLIST" | "HOLD" | "REJECT"> = {
      SHORTLIST: "SHORTLIST",
      HOLD: "HOLD",
      REJECT: "REJECT",
    };

    return prisma.$transaction(async (tx) => {
      // Clear old criteria scores
      await tx.screeningCriteriaScore.deleteMany({ where: { screeningId: id } });

      const updated = await tx.screeningInterview.update({
        where: { id },
        data: {
          conductedAt: data.conductedAt ?? new Date(),
          overallScore,
          verdict: verdictMap[data.verdict],
          recommendation: data.recommendation,
          notes: data.notes,
          currentCtcDisclosed: data.currentCtcDisclosed,
          expectedCtcDisclosed: data.expectedCtcDisclosed,
          noticePeriodDays: data.noticePeriodDays,
          canJoinEarlier: data.canJoinEarlier,
          ...data.scorecard,
          criteriaScores: data.criteriaScores
            ? {
                create: data.criteriaScores.map((cs) => ({
                  criterion: cs.criterion,
                  score: cs.score,
                  notes: cs.notes,
                })),
              }
            : undefined,
        },
        include: SCREENING_INCLUDE,
      });

      return updated;
    });
  },

  /**
   * Soft delete (cancel).
   */
  async softDelete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return prisma.screeningInterview.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: SCREENING_INCLUDE,
    });
  },

  /**
   * Restore a soft-deleted screening.
   */
  async restore(tenantId: string, id: string) {
    const record = await prisma.screeningInterview.findFirst({
      where: { id, tenantId },
    });
    if (!record) throw new AppError("Screening interview not found.", 404);

    return prisma.screeningInterview.update({
      where: { id },
      data: { deletedAt: null },
      include: SCREENING_INCLUDE,
    });
  },

  // ── Analytics ──────────────────────────────────────────────────────────────

  /**
   * Metrics for the screening dashboard.
   */
  async getMetrics(tenantId: string) {
    const [total, shortlisted, rejected, held, conducted] = await Promise.all([
      prisma.screeningInterview.count({ where: { tenantId, deletedAt: null } }),
      prisma.screeningInterview.count({ where: { tenantId, deletedAt: null, verdict: "SHORTLIST" } }),
      prisma.screeningInterview.count({ where: { tenantId, deletedAt: null, verdict: "REJECT" } }),
      prisma.screeningInterview.count({ where: { tenantId, deletedAt: null, verdict: "HOLD" } }),
      prisma.screeningInterview.count({ where: { tenantId, deletedAt: null, conductedAt: { not: null } } }),
    ]);

    const avgScoreRaw = await prisma.screeningInterview.aggregate({
      where: { tenantId, deletedAt: null, overallScore: { not: null } },
      _avg: { overallScore: true },
    });

    const shortlistRate = total > 0 ? Math.round((shortlisted / total) * 100) : 0;
    const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;

    // Top interviewers by volume
    const byInterviewer = await prisma.screeningInterview.groupBy({
      by: ["interviewerId"],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    return {
      total,
      shortlisted,
      rejected,
      held,
      conducted,
      pending: total - conducted,
      shortlistRate,
      rejectionRate,
      averageScore: avgScoreRaw._avg.overallScore ?? 0,
      byInterviewer,
    };
  },
};
