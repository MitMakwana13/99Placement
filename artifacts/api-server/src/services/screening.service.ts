/**
 * Internal Screening Service
 *
 * Business logic layer for 99 Placement's internal interview process.
 *
 * Business Rules:
 * 1. Only one ACTIVE screening per pipeline (enforced in repo)
 * 2. Scorecard must be submitted before verdict is issued
 * 3. SHORTLIST verdict moves pipeline to ASSESSED stage
 * 4. REJECT verdict moves pipeline to REJECTED stage
 * 5. HOLD verdict keeps pipeline at current stage
 * 6. Screening can only be scheduled for pipelines in SOURCED or SCREENED stages
 */

import { domainEventBus } from "../events/event-bus";
import { ScreeningRepository, ScreeningScorecard } from "../repositories/screening.repository";
import { PipelineRepository } from "../repositories/pipeline.repository";
import { AppError } from "../utils/app-error";
import {
  ScreeningScheduledEvent,
  ScreeningConductedEvent,
  ScreeningShortlistedEvent,
  ScreeningRejectedEvent,
  ScreeningRescheduledEvent,
  ScreeningCancelledEvent,
} from "../events/screening/screening.events";
import { logger } from "../config/logger";

// ── Input Types ───────────────────────────────────────────────────────────────

export interface ScheduleScreeningInput {
  pipelineId: string;
  interviewerId: string;
  scheduledAt: Date;
  mode?: "phone" | "video" | "in_person";
}

export interface SubmitScorecardInput {
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
}

export interface RescheduleScreeningInput {
  scheduledAt: Date;
  interviewerId?: string;
  mode?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const ScreeningService = {

  /**
   * Schedule a 99 Placement internal screening interview.
   * Validates the pipeline stage before scheduling.
   */
  async scheduleScreening(
    tenantId: string,
    input: ScheduleScreeningInput,
    performedById: string,
  ) {
    // Validate pipeline exists and is in a valid stage for screening
    const pipeline = await PipelineRepository.findById(tenantId, input.pipelineId);
    const validStages = ["SOURCED", "SCREENED", "ASSESSED"];
    if (!validStages.includes(pipeline.stage)) {
      throw new AppError(
        `Pipeline must be in SOURCED, SCREENED, or ASSESSED stage to schedule screening. Current stage: ${pipeline.stage}`,
        400,
      );
    }

    // Validate scheduledAt is in the future
    if (input.scheduledAt <= new Date()) {
      throw new AppError("Screening must be scheduled for a future date and time.", 400);
    }

    const screening = await ScreeningRepository.create(tenantId, input);

    await domainEventBus.publish(
      new ScreeningScheduledEvent(
        tenantId,
        screening.id,
        input.pipelineId,
        pipeline.candidateId,
        input.interviewerId,
        input.scheduledAt,
        input.mode ?? "phone",
        performedById,
      ),
    );

    logger.info(`Screening scheduled: ${screening.id} for pipeline ${input.pipelineId}`);
    return screening;
  },

  /**
   * Submit the full scorecard and issue a verdict.
   * Automatically advances or rejects the pipeline based on verdict.
   */
  async submitScorecard(
    tenantId: string,
    screeningId: string,
    input: SubmitScorecardInput,
    performedById: string,
  ) {
    const screening = await ScreeningRepository.findById(tenantId, screeningId);

    // Prevent double submission
    if (screening.verdict !== null) {
      throw new AppError(
        `Scorecard already submitted for this screening with verdict: ${screening.verdict}`,
        409,
      );
    }

    const updated = await ScreeningRepository.submitScorecard(tenantId, screeningId, input);
    const pipeline = updated.pipeline;
    const candidateId = pipeline.candidate.id;

    // Publish conducted event
    await domainEventBus.publish(
      new ScreeningConductedEvent(
        tenantId,
        screeningId,
        updated.pipelineId,
        candidateId,
        updated.overallScore ?? 0,
        input.verdict,
        performedById,
      ),
    );

    // Advance pipeline stage based on verdict
    if (input.verdict === "SHORTLIST") {
      // Move to ASSESSED — ready for assessment test
      await PipelineRepository.updateStage(tenantId, updated.pipelineId, {
        newStage: "ASSESSED",
        reason: `Passed 99 Placement internal screening. Score: ${updated.overallScore}/10`,
        performedById,
      });

      await domainEventBus.publish(
        new ScreeningShortlistedEvent(
          tenantId,
          screeningId,
          updated.pipelineId,
          candidateId,
          updated.overallScore ?? 0,
          performedById,
        ),
      );

    } else if (input.verdict === "REJECT") {
      // Move to REJECTED
      await PipelineRepository.updateStage(tenantId, updated.pipelineId, {
        newStage: "REJECTED",
        reason: input.recommendation ?? "Did not pass internal screening.",
        performedById,
      });

      await domainEventBus.publish(
        new ScreeningRejectedEvent(
          tenantId,
          screeningId,
          updated.pipelineId,
          candidateId,
          input.recommendation,
          performedById,
        ),
      );
    }
    // HOLD: no stage change

    logger.info(`Screening scorecard submitted: ${screeningId}. Verdict: ${input.verdict}`);
    return updated;
  },

  /**
   * Reschedule an existing screening interview.
   */
  async rescheduleScreening(
    tenantId: string,
    screeningId: string,
    input: RescheduleScreeningInput,
    performedById: string,
  ) {
    const existing = await ScreeningRepository.findById(tenantId, screeningId);

    if (existing.verdict !== null) {
      throw new AppError("Cannot reschedule a screening that has already been completed.", 400);
    }

    if (input.scheduledAt <= new Date()) {
      throw new AppError("New scheduled time must be in the future.", 400);
    }

    const updated = await ScreeningRepository.reschedule(tenantId, screeningId, input);

    await domainEventBus.publish(
      new ScreeningRescheduledEvent(
        tenantId,
        screeningId,
        existing.pipelineId,
        existing.pipeline.candidate.id,
        existing.scheduledAt,
        input.scheduledAt,
        performedById,
      ),
    );

    return updated;
  },

  /**
   * Cancel a screening interview (soft delete).
   */
  async cancelScreening(
    tenantId: string,
    screeningId: string,
    reason: string | undefined,
    performedById: string,
  ) {
    const existing = await ScreeningRepository.findById(tenantId, screeningId);

    if (existing.verdict !== null) {
      throw new AppError("Cannot cancel a screening that has already been completed.", 400);
    }

    const deleted = await ScreeningRepository.softDelete(tenantId, screeningId);

    await domainEventBus.publish(
      new ScreeningCancelledEvent(
        tenantId,
        screeningId,
        existing.pipelineId,
        existing.pipeline.candidate.id,
        reason,
        performedById,
      ),
    );

    return deleted;
  },

  /**
   * Restore a cancelled screening.
   */
  async restoreScreening(tenantId: string, screeningId: string) {
    return ScreeningRepository.restore(tenantId, screeningId);
  },

  /**
   * Find a single screening.
   */
  async findById(tenantId: string, screeningId: string) {
    return ScreeningRepository.findById(tenantId, screeningId);
  },

  /**
   * Find all screenings for a pipeline.
   */
  async findByPipeline(tenantId: string, pipelineId: string) {
    return ScreeningRepository.findByPipeline(tenantId, pipelineId);
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
    return ScreeningRepository.findMany(tenantId, filters, options);
  },

  /**
   * Screening metrics dashboard.
   */
  async getMetrics(tenantId: string) {
    return ScreeningRepository.getMetrics(tenantId);
  },
};
