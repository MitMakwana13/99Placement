import { OfferRepository, CreateOfferInput } from "../repositories/offer.repository";
import { PipelineRepository } from "../repositories/pipeline.repository";
import { JoiningRepository } from "../repositories/joining.repository";
import { JoiningService } from "./joining.service";
import { domainEventBus } from "../events/event-bus";
import {
  OfferCreatedEvent,
  OfferApprovedEvent,
  OfferReleasedEvent,
  OfferAcceptedEvent,
  OfferDeclinedEvent,
  OfferRevokedEvent,
} from "../events/hiring-decision/hiring-decision.events";
import { AppError } from "../utils/app-error";
import { logger } from "../config/logger";
import { OfferStatus } from "@workspace/db-prisma";

export const OfferService = {
  async createOffer(tenantId: string, input: CreateOfferInput, performedById: string) {
    const pipeline = await PipelineRepository.findById(tenantId, input.pipelineId);
    if (!pipeline) {
      throw new AppError("Candidate pipeline not found", 404);
    }

    if (pipeline.stage === "REJECTED" || pipeline.stage === "DROPPED") {
      throw new AppError(`Cannot create offer for a ${pipeline.stage.toLowerCase()} candidate`, 400);
    }

    // Invariant: Candidate must have passed screening / assessment
    // For 99 Placement, we can enforce that they are at least SHORTLISTED or CLIENT_FEEDBACK
    // Let's verify stage is appropriate (optional, but let's allow flexibility as long as not SOURCED/SCREENING)
    if (pipeline.stage === "SOURCED" || pipeline.stage === "SCREENED") {
      throw new AppError("Candidate must pass screening and assessments before creating an offer", 400);
    }

    const offer = await OfferRepository.create(tenantId, input);

    await domainEventBus.publish(
      new OfferCreatedEvent(
        tenantId,
        offer.id,
        pipeline.id,
        pipeline.candidateId,
        input.offeredCtc,
        input.designation,
        input.joiningDate,
        performedById
      )
    );

    logger.info(`Offer created in Draft: ${offer.id}`);
    return offer;
  },

  async submitForApproval(tenantId: string, id: string, approverUserIds: string[], performedById: string) {
    const offer = await OfferRepository.findById(tenantId, id);
    if (offer.status !== "DRAFTED" && offer.status !== "PENDING_APPROVAL") {
      throw new AppError(`Cannot submit offer in status ${offer.status} for approval`, 400);
    }

    if (!approverUserIds || approverUserIds.length === 0) {
      throw new AppError("At least one approver must be specified", 400);
    }

    // Create required approvals in transaction
    await OfferRepository.updateStatus(tenantId, id, "PENDING_APPROVAL");

    for (const approverId of approverUserIds) {
      await OfferRepository.upsertApproval(tenantId, id, approverId, "PENDING");
    }

    logger.info(`Offer ${id} submitted for approval to: ${approverUserIds.join(", ")}`);
    return OfferRepository.findById(tenantId, id);
  },

  async submitApprovalDecision(
    tenantId: string,
    id: string,
    approverId: string,
    decision: "APPROVED" | "REJECTED",
    comments: string | undefined,
    performedById: string
  ) {
    const offer = await OfferRepository.findById(tenantId, id);
    if (offer.status !== "PENDING_APPROVAL") {
      throw new AppError("Offer is not pending approval", 400);
    }

    // Verify user is an assigned approver
    const approvalRecord = offer.approvals.find((a) => a.approverId === approverId);
    if (!approvalRecord) {
      throw new AppError("User is not authorized to approve this offer", 403);
    }

    // Record decision
    await OfferRepository.upsertApproval(tenantId, id, approverId, decision, comments);

    if (decision === "REJECTED") {
      // If any approver rejects, the entire offer status becomes REJECTED
      const updated = await OfferRepository.updateStatus(tenantId, id, "REJECTED");
      await domainEventBus.publish(
        new OfferDeclinedEvent(
          tenantId,
          id,
          offer.pipelineId,
          offer.pipeline.candidateId,
          comments ?? "Offer approval rejected by reviewer",
          performedById
        )
      );
      logger.info(`Offer ${id} rejected by approver ${approverId}`);
      return updated;
    }

    // Check if ALL approvals are APPROVED
    const approvals = await OfferRepository.findApprovalsByOfferId(id);
    const allApproved = approvals.every((a) => a.status === "APPROVED");

    if (allApproved) {
      const updated = await OfferRepository.updateStatus(tenantId, id, "APPROVED");
      await domainEventBus.publish(
        new OfferApprovedEvent(
          tenantId,
          id,
          offer.pipelineId,
          offer.pipeline.candidateId,
          approverId,
          performedById
        )
      );
      logger.info(`Offer ${id} fully approved!`);
      return updated;
    }

    logger.info(`Offer ${id} approved by ${approverId}. Remaining approvals pending.`);
    return OfferRepository.findById(tenantId, id);
  },

  async releaseOffer(tenantId: string, id: string, performedById: string) {
    const offer = await OfferRepository.findById(tenantId, id);
    
    // Invariant: Offer cannot be released until it is APPROVED
    if (offer.status !== "APPROVED") {
      throw new AppError("Offer letter must be fully approved before release", 400);
    }

    const updated = await OfferRepository.updateStatus(tenantId, id, "SENT", { sentAt: new Date() });

    // Transition candidate stage to OFFER
    await PipelineRepository.updateStage(tenantId, offer.pipelineId, {
      newStage: "OFFER",
      reason: `Offer letter released. CTC: ${offer.offeredCtc}, Designation: ${offer.designation}`,
      performedById,
    });

    await domainEventBus.publish(
      new OfferReleasedEvent(
        tenantId,
        id,
        offer.pipelineId,
        offer.pipeline.candidateId,
        performedById
      )
    );

    logger.info(`Offer released for pipeline: ${offer.pipelineId}`);
    return updated;
  },

  async acceptOffer(tenantId: string, id: string, performedById: string) {
    const offer = await OfferRepository.findById(tenantId, id);
    if (offer.status !== "SENT") {
      throw new AppError("Cannot accept an offer that has not been sent", 400);
    }

    const acceptedAt = new Date();
    const updated = await OfferRepository.updateStatus(tenantId, id, "ACCEPTED", { acceptedAt });

    // Transition candidate stage to JOINING
    await PipelineRepository.updateStage(tenantId, offer.pipelineId, {
      newStage: "JOINING",
      reason: "Offer accepted by candidate",
      performedById,
    });

    // Auto-create/initialize Joining record
    let joiningRecord = await JoiningRepository.findByPipelineId(tenantId, offer.pipelineId);
    if (!joiningRecord) {
      joiningRecord = await JoiningService.initiateJoining(tenantId, {
        pipelineId: offer.pipelineId,
        joiningDate: offer.joiningDate ?? undefined,
      }, performedById);
    }

    await domainEventBus.publish(
      new OfferAcceptedEvent(
        tenantId,
        id,
        offer.pipelineId,
        offer.pipeline.candidateId,
        acceptedAt,
        performedById
      )
    );

    logger.info(`Offer accepted. Joining record initialized for pipeline: ${offer.pipelineId}`);
    return updated;
  },

  async declineOffer(tenantId: string, id: string, reason: string | undefined, performedById: string) {
    const offer = await OfferRepository.findById(tenantId, id);
    if (offer.status !== "SENT") {
      throw new AppError("Offer letter is not sent", 400);
    }

    const updated = await OfferRepository.updateStatus(tenantId, id, "REJECTED");

    // Transition candidate stage to REJECTED or WITHDRAWN
    await PipelineRepository.updateStage(tenantId, offer.pipelineId, {
      newStage: "REJECTED",
      reason: reason ?? "Offer declined by candidate",
      performedById,
    });

    await domainEventBus.publish(
      new OfferDeclinedEvent(
        tenantId,
        id,
        offer.pipelineId,
        offer.pipeline.candidateId,
        reason,
        performedById
      )
    );

    logger.info(`Offer declined for pipeline: ${offer.pipelineId}`);
    return updated;
  },

  async revokeOffer(tenantId: string, id: string, reason: string | undefined, performedById: string) {
    const offer = await OfferRepository.findById(tenantId, id);
    if (offer.status === "ACCEPTED" || offer.status === "REJECTED" || offer.status === "REVOKED") {
      throw new AppError(`Cannot revoke offer in status ${offer.status}`, 400);
    }

    const updated = await OfferRepository.updateStatus(tenantId, id, "REVOKED");

    // Transition candidate stage to REJECTED
    await PipelineRepository.updateStage(tenantId, offer.pipelineId, {
      newStage: "REJECTED",
      reason: reason ?? "Offer revoked by employer",
      performedById,
    });

    await domainEventBus.publish(
      new OfferRevokedEvent(
        tenantId,
        id,
        offer.pipelineId,
        offer.pipeline.candidateId,
        reason,
        performedById
      )
    );

    logger.info(`Offer revoked for pipeline: ${offer.pipelineId}`);
    return updated;
  },
};
