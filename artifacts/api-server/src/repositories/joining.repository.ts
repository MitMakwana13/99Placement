import { prisma, Prisma, RetentionStatus } from "@workspace/db-prisma";
import { AppError } from "../utils/app-error";

export interface CreateJoiningInput {
  pipelineId: string;
  joiningDate?: Date;
  noticePeriodDays?: number;
  noticeStartDate?: Date;
}

export interface UpdateJoiningInput {
  joiningDate?: Date;
  actualJoinedAt?: Date;
  bgvStatus?: string;
  docCollectionStatus?: string;
  laptopIssued?: boolean;
  idCardIssued?: boolean;
}

export interface CreateFollowupInput {
  pipelineId: string;
  checkType: string;
  scheduledAt?: Date;
  notes?: string;
  retentionStatus?: string;
}

export const JoiningRepository = {
  async create(tenantId: string, input: CreateJoiningInput) {
    return prisma.joiningStatus.create({
      data: {
        tenantId,
        pipelineId: input.pipelineId,
        joiningDate: input.joiningDate,
        noticePeriodDays: input.noticePeriodDays,
        noticeStartDate: input.noticeStartDate,
        bgvStatus: "pending",
        docCollectionStatus: "pending",
        laptopIssued: false,
        idCardIssued: false,
      },
      include: {
        pipeline: {
          include: {
            candidate: true,
          },
        },
      },
    });
  },

  async findById(tenantId: string, id: string) {
    const record = await prisma.joiningStatus.findFirst({
      where: { id, tenantId },
      include: {
        pipeline: {
          include: {
            candidate: true,
          },
        },
      },
    });
    if (!record) {
      throw new AppError("Joining status record not found", 404);
    }
    return record;
  },

  async findByPipelineId(tenantId: string, pipelineId: string) {
    return prisma.joiningStatus.findFirst({
      where: { pipelineId, tenantId },
      include: {
        pipeline: {
          include: {
            candidate: true,
          },
        },
      },
    });
  },

  async findMany(tenantId: string, filters: { pipelineId?: string }) {
    const where: Prisma.JoiningStatusWhereInput = {
      tenantId,
    };
    if (filters.pipelineId) {
      where.pipelineId = filters.pipelineId;
    }
    return prisma.joiningStatus.findMany({
      where,
      include: {
        pipeline: {
          include: {
            candidate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async update(tenantId: string, id: string, data: UpdateJoiningInput) {
    return prisma.joiningStatus.update({
      where: { id, tenantId },
      data,
      include: {
        pipeline: {
          include: {
            candidate: true,
          },
        },
      },
    });
  },

  async createFollowup(tenantId: string, input: CreateFollowupInput) {
    return prisma.postJoiningFollowup.create({
      data: {
        tenantId,
        pipelineId: input.pipelineId,
        checkType: input.checkType,
        scheduledAt: input.scheduledAt,
        notes: input.notes,
        retentionStatus: input.retentionStatus ? (input.retentionStatus.toUpperCase() as RetentionStatus) : "UNKNOWN",
      },
    });
  },

  async findFollowupsByPipelineId(tenantId: string, pipelineId: string) {
    return prisma.postJoiningFollowup.findMany({
      where: { pipelineId, tenantId },
      orderBy: { createdAt: "desc" },
    });
  },
};
