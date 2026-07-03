import { prisma, Prisma, InterviewStatus, InterviewMode, InterviewType } from "@workspace/db-prisma";
import { AppError } from "../utils/app-error";

export interface CreateInterviewInput {
  pipelineId: string;
  interviewerId?: string;
  title: string;
  scheduledAt: Date;
  durationMin?: number;
  timezone?: string;
  location?: string;
  meetingLink?: string;
  meetingId?: string;
  agenda?: string;
  interviewType?: InterviewType;
  mode?: InterviewMode;
  roundNumber?: number;
  panelUserIds?: string[];
}

export interface SubmitInterviewFeedbackInput {
  submittedById: string;
  strengths?: string;
  weaknesses?: string;
  comments?: string;
  recommendation?: string; // e.g. HIRE | HOLD | REJECT
  overallRating?: number; // e.g. 1-10
  scores?: Array<{ dimension: string; score: number; notes?: string }>;
}

export const InterviewRepository = {
  async create(tenantId: string, input: CreateInterviewInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Create interview record
      const interview = await tx.interview.create({
        data: {
          tenantId,
          pipelineId: input.pipelineId,
          interviewerId: input.interviewerId,
          title: input.title,
          scheduledAt: input.scheduledAt,
          durationMin: input.durationMin ?? 60,
          timezone: input.timezone ?? "UTC",
          location: input.location,
          meetingLink: input.meetingLink,
          meetingId: input.meetingId,
          agenda: input.agenda,
          interviewType: input.interviewType ?? "HR",
          mode: input.mode ?? "VIRTUAL",
          roundNumber: input.roundNumber ?? 1,
        },
      });

      // 2. Add panel members if provided
      if (input.panelUserIds && input.panelUserIds.length > 0) {
        await tx.interviewPanel.createMany({
          data: input.panelUserIds.map((userId) => ({
            tenantId,
            interviewId: interview.id,
            userId,
          })),
        });
      }

      const created = await tx.interview.findUnique({
        where: { id: interview.id },
        include: {
          panel: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
      if (!created) throw new AppError("Failed to create interview", 500);
      return created;
    });
  },

  async findById(tenantId: string, id: string) {
    const interview = await prisma.interview.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        panel: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        feedback: {
          include: {
            submittedBy: { select: { id: true, name: true, email: true } },
            scores: true,
          },
        },
        scores: true,
        pipeline: {
          include: {
            candidate: true,
          },
        },
      },
    });

    if (!interview) {
      throw new AppError("Interview not found", 404);
    }
    return interview;
  },

  async findMany(tenantId: string, filters: { pipelineId?: string; interviewerId?: string; status?: InterviewStatus }) {
    const where: Prisma.InterviewWhereInput = {
      tenantId,
      deletedAt: null,
    };
    if (filters.pipelineId) {
      where.pipelineId = filters.pipelineId;
    }
    if (filters.interviewerId) {
      where.OR = [
        { interviewerId: filters.interviewerId },
        { panel: { some: { userId: filters.interviewerId } } },
      ];
    }
    if (filters.status) {
      where.status = filters.status;
    }

    return prisma.interview.findMany({
      where,
      include: {
        panel: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        feedback: true,
        pipeline: {
          include: {
            candidate: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });
  },

  async reschedule(tenantId: string, id: string, data: { scheduledAt: Date; durationMin?: number; timezone?: string; meetingLink?: string; location?: string }) {
    return prisma.interview.update({
      where: { id, tenantId },
      data: {
        scheduledAt: data.scheduledAt,
        durationMin: data.durationMin,
        timezone: data.timezone,
        meetingLink: data.meetingLink,
        location: data.location,
        status: "SCHEDULED",
      },
    });
  },

  async cancel(tenantId: string, id: string, cancellationReason: string) {
    return prisma.interview.update({
      where: { id, tenantId },
      data: {
        status: "CANCELLED",
        cancellationReason,
      },
    });
  },

  async updateStatus(tenantId: string, id: string, status: InterviewStatus, extras: { cancellationReason?: string; completedAt?: Date; noShowAt?: Date; hiringDecision?: string } = {}) {
    return prisma.interview.update({
      where: { id, tenantId },
      data: {
        status,
        ...extras,
      },
    });
  },

  async submitFeedback(tenantId: string, interviewId: string, input: SubmitInterviewFeedbackInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Create InterviewFeedback
      const feedback = await tx.interviewFeedback.create({
        data: {
          tenantId,
          interviewId,
          submittedById: input.submittedById,
          strengths: input.strengths,
          weaknesses: input.weaknesses,
          comments: input.comments,
          recommendation: input.recommendation,
          overallRating: input.overallRating,
        },
      });

      // 2. Create InterviewScore dimensions if present
      if (input.scores && input.scores.length > 0) {
        await tx.interviewScore.createMany({
          data: input.scores.map((s) => ({
            interviewId,
            feedbackId: feedback.id,
            dimension: s.dimension,
            score: s.score,
            notes: s.notes,
          })),
        });
      }

      // Return refreshed interview
      const updated = await tx.interview.findUnique({
        where: { id: interviewId },
        include: {
          feedback: {
            include: {
              submittedBy: { select: { id: true, name: true, email: true } },
              scores: true,
            },
          },
          scores: true,
        },
      });
      if (!updated) throw new AppError("Failed to update interview feedback", 500);
      return updated;
    });
  },
};
