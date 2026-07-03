import { prisma, Prisma, OfferStatus } from "@workspace/db-prisma";
import { AppError } from "../utils/app-error";

export interface CreateOfferInput {
  pipelineId: string;
  offeredCtc: number;
  designation: string;
  joiningDate: Date;
  letterUrl?: string;
}

export const OfferRepository = {
  async create(tenantId: string, input: CreateOfferInput) {
    return prisma.offerLetter.create({
      data: {
        tenantId,
        pipelineId: input.pipelineId,
        offeredCtc: input.offeredCtc,
        designation: input.designation,
        joiningDate: input.joiningDate,
        letterUrl: input.letterUrl,
        status: "DRAFTED",
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
    const offer = await prisma.offerLetter.findFirst({
      where: { id, tenantId },
      include: {
        approvals: {
          include: {
            approver: { select: { id: true, name: true, email: true } },
          },
        },
        pipeline: {
          include: {
            candidate: true,
          },
        },
      },
    });

    if (!offer) {
      throw new AppError("Offer not found", 404);
    }
    return offer;
  },

  async findMany(tenantId: string, filters: { pipelineId?: string; status?: OfferStatus }) {
    const where: Prisma.OfferLetterWhereInput = {
      tenantId,
    };
    if (filters.pipelineId) {
      where.pipelineId = filters.pipelineId;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    return prisma.offerLetter.findMany({
      where,
      include: {
        approvals: {
          include: {
            approver: { select: { id: true, name: true, email: true } },
          },
        },
        pipeline: {
          include: {
            candidate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async updateStatus(tenantId: string, id: string, status: OfferStatus, extras: { sentAt?: Date; acceptedAt?: Date } = {}) {
    return prisma.offerLetter.update({
      where: { id, tenantId },
      data: {
        status,
        ...extras,
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

  async updateOffer(tenantId: string, id: string, data: Partial<CreateOfferInput>) {
    return prisma.offerLetter.update({
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

  async upsertApproval(tenantId: string, offerId: string, approverId: string, status: string, comments?: string) {
    return prisma.offerApproval.upsert({
      where: {
        offerId_approverId: {
          offerId,
          approverId,
        },
      },
      update: {
        status,
        comments,
      },
      create: {
        tenantId,
        offerId,
        approverId,
        status,
        comments,
      },
    });
  },

  async findApprovalsByOfferId(offerId: string) {
    return prisma.offerApproval.findMany({
      where: { offerId },
    });
  },
};
