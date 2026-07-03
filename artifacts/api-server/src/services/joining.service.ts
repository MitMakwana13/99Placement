import { JoiningRepository, CreateJoiningInput, UpdateJoiningInput, CreateFollowupInput } from "../repositories/joining.repository";
import { PipelineRepository } from "../repositories/pipeline.repository";
import { domainEventBus } from "../events/event-bus";
import {
  JoiningScheduledEvent,
  CandidateJoinedEvent,
  CandidateNoShowEvent,
  JoiningFollowupCreatedEvent,
} from "../events/hiring-decision/hiring-decision.events";
import { AppError } from "../utils/app-error";
import { logger } from "../config/logger";

export const JoiningService = {
  async initiateJoining(tenantId: string, input: CreateJoiningInput, performedById: string) {
    const pipeline = await PipelineRepository.findById(tenantId, input.pipelineId);
    if (!pipeline) {
      throw new AppError("Candidate pipeline not found", 404);
    }

    let record = await JoiningRepository.findByPipelineId(tenantId, input.pipelineId);
    if (record) {
      throw new AppError("Joining status record already exists for this pipeline", 400);
    }

    record = await JoiningRepository.create(tenantId, input);

    if (input.joiningDate) {
      await domainEventBus.publish(
        new JoiningScheduledEvent(
          tenantId,
          record.id,
          pipeline.id,
          pipeline.candidateId,
          input.joiningDate,
          performedById
        )
      );
    }

    logger.info(`Joining record initiated: ${record.id}`);
    return record;
  },

  async getJoiningRecord(tenantId: string, pipelineId: string) {
    const record = await JoiningRepository.findByPipelineId(tenantId, pipelineId);
    if (!record) {
      throw new AppError("Joining record not found", 404);
    }
    return record;
  },

  async updateOnboardingProgress(
    tenantId: string,
    pipelineId: string,
    input: UpdateJoiningInput,
    performedById: string
  ) {
    const record = await JoiningRepository.findByPipelineId(tenantId, pipelineId);
    if (!record) {
      throw new AppError("Joining record not found", 404);
    }

    const updated = await JoiningRepository.update(tenantId, record.id, input);
    logger.info(`Onboarding progress updated for pipeline ${pipelineId}`);
    return updated;
  },

  async markCandidateJoined(
    tenantId: string,
    pipelineId: string,
    actualJoinedAt: Date,
    overridePlannedDate: boolean = false,
    performedById: string
  ) {
    const record = await JoiningRepository.findByPipelineId(tenantId, pipelineId);
    if (!record) {
      throw new AppError("Joining record not found", 404);
    }

    // Invariant: Cannot mark candidate as joined before the planned joining date
    if (record.joiningDate && actualJoinedAt < new Date(record.joiningDate) && !overridePlannedDate) {
      throw new AppError(
        "Cannot mark candidate as joined before the planned joining date without explicit override.",
        400
      );
    }

    const updated = await JoiningRepository.update(tenantId, record.id, {
      actualJoinedAt,
    });

    // Advance pipeline stage to HIRED
    await PipelineRepository.updateStage(tenantId, pipelineId, {
      newStage: "POST_JOINING",
      reason: `Candidate joined on ${actualJoinedAt.toISOString()}`,
      performedById,
    });

    await domainEventBus.publish(
      new CandidateJoinedEvent(
        tenantId,
        record.id,
        pipelineId,
        record.pipeline.candidateId,
        actualJoinedAt,
        performedById
      )
    );

    logger.info(`Candidate successfully onboarded as HIRED: ${pipelineId}`);
    return updated;
  },

  async markCandidateNoShow(tenantId: string, pipelineId: string, performedById: string) {
    const record = await JoiningRepository.findByPipelineId(tenantId, pipelineId);
    if (!record) {
      throw new AppError("Joining record not found", 404);
    }

    const updated = await JoiningRepository.update(tenantId, record.id, {
      bgvStatus: "failed",
    });

    // Update pipeline stage to REJECTED or WITHDRAWN
    await PipelineRepository.updateStage(tenantId, pipelineId, {
      newStage: "REJECTED",
      reason: "Candidate did not show up on joining date",
      performedById,
    });

    await domainEventBus.publish(
      new CandidateNoShowEvent(
        tenantId,
        record.id,
        pipelineId,
        record.pipeline.candidateId,
        performedById
      )
    );

    logger.info(`Candidate marked as no-show: ${pipelineId}`);
    return updated;
  },

  async createPostJoiningFollowup(tenantId: string, input: CreateFollowupInput, performedById: string) {
    const record = await JoiningRepository.findByPipelineId(tenantId, input.pipelineId);
    if (!record) {
      throw new AppError("Joining record must exist before scheduling follow-up checks", 400);
    }

    const followup = await JoiningRepository.createFollowup(tenantId, input);

    await domainEventBus.publish(
      new JoiningFollowupCreatedEvent(
        tenantId,
        followup.id,
        input.pipelineId,
        record.pipeline.candidateId,
        input.checkType,
        performedById
      )
    );

    logger.info(`Post-joining follow-up created: ${followup.id}`);
    return followup;
  },

  async getPostJoiningFollowups(tenantId: string, pipelineId: string) {
    return JoiningRepository.findFollowupsByPipelineId(tenantId, pipelineId);
  },
};
