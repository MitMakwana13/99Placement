import { prisma } from "@workspace/db-prisma";
import { IEventHandler } from "../domain-event";
import {
  CandidateAddedToPipelineEvent,
  PipelineStageChangedEvent,
  CandidateRejectedEvent,
  CandidateWithdrawnEvent,
  CandidateShortlistedEvent,
  CandidateHiredEvent,
  ReminderCreatedEvent,
  RatingUpdatedEvent,
} from "./pipeline.events";
import logger from "../../lib/logger";

// ─────────────────────────────────────────────────────────────────────────────
// CandidateAddedToPipeline Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class CandidateAddedToPipelineTimelineHandler implements IEventHandler<CandidateAddedToPipelineEvent> {
  async handle(event: CandidateAddedToPipelineEvent): Promise<void> {
    // Write to CandidateTimeline
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Added to Job Pipeline",
        description: `Candidate was added to Job "${event.jobId}" in stage "${event.stage}".`,
        performedById: event.performedById,
        metadata: { jobId: event.jobId, pipelineId: event.pipelineId },
      },
    });

    // Write to PipelineActivity
    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "CANDIDATE_ADDED",
        title: "Added to Pipeline",
        description: `Candidate added to the hiring pipeline for Job "${event.jobId}".`,
        performedById: event.performedById,
      },
    });
  }
}

export class CandidateAddedToPipelineAuditHandler implements IEventHandler<CandidateAddedToPipelineEvent> {
  async handle(event: CandidateAddedToPipelineEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "PIPELINE",
        entityId: event.pipelineId,
        action: "ADD_CANDIDATE",
        performedById: event.performedById,
        metadata: { candidateId: event.candidateId, jobId: event.jobId },
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PipelineStageChanged Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class PipelineStageChangedTimelineHandler implements IEventHandler<PipelineStageChangedEvent> {
  async handle(event: PipelineStageChangedEvent): Promise<void> {
    // Write to CandidateTimeline
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Pipeline Stage Moved",
        description: `Moved from "${event.oldStage ?? "None"}" to "${event.newStage}".`,
        performedById: event.performedById,
        metadata: { oldStage: event.oldStage, newStage: event.newStage, reason: event.reason },
      },
    });

    // Write to PipelineActivity
    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "STAGE_CHANGE",
        title: "Stage Updated",
        description: `Pipeline stage changed to "${event.newStage}"${event.reason ? ` due to: ${event.reason}` : ""}.`,
        performedById: event.performedById,
        metadata: { oldStage: event.oldStage, newStage: event.newStage, reason: event.reason },
      },
    });
  }
}

export class PipelineStageChangedAuditHandler implements IEventHandler<PipelineStageChangedEvent> {
  async handle(event: PipelineStageChangedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "PIPELINE",
        entityId: event.pipelineId,
        action: "STAGE_CHANGE",
        performedById: event.performedById,
        metadata: { oldStage: event.oldStage, newStage: event.newStage, reason: event.reason },
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CandidateRejected Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class CandidateRejectedTimelineHandler implements IEventHandler<CandidateRejectedEvent> {
  async handle(event: CandidateRejectedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Candidate Rejected",
        description: `Rejected at stage "${event.stage}"${event.reason ? `: ${event.reason}` : ""}.`,
        performedById: event.performedById,
        metadata: { stage: event.stage, reason: event.reason },
      },
    });

    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "REJECTED",
        title: "Rejected",
        description: `Candidate was rejected at stage "${event.stage}"${event.reason ? ` (Reason: ${event.reason})` : ""}.`,
        performedById: event.performedById,
        metadata: { stage: event.stage, reason: event.reason },
      },
    });
  }
}

export class CandidateRejectedAuditHandler implements IEventHandler<CandidateRejectedEvent> {
  async handle(event: CandidateRejectedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "PIPELINE",
        entityId: event.pipelineId,
        action: "REJECT",
        performedById: event.performedById,
        metadata: { stage: event.stage, reason: event.reason },
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CandidateWithdrawn Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class CandidateWithdrawnTimelineHandler implements IEventHandler<CandidateWithdrawnEvent> {
  async handle(event: CandidateWithdrawnEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Application Withdrawn",
        description: event.reason ? `Withdrawn: ${event.reason}` : "Candidate withdrew their application.",
        performedById: event.performedById,
        metadata: { reason: event.reason },
      },
    });

    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "WITHDRAWN",
        title: "Withdrawn",
        description: `Application withdrawn${event.reason ? ` (Reason: ${event.reason})` : ""}.`,
        performedById: event.performedById,
        metadata: { reason: event.reason },
      },
    });
  }
}

export class CandidateWithdrawnAuditHandler implements IEventHandler<CandidateWithdrawnEvent> {
  async handle(event: CandidateWithdrawnEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "PIPELINE",
        entityId: event.pipelineId,
        action: "WITHDRAW",
        performedById: event.performedById,
        metadata: { reason: event.reason },
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CandidateShortlisted Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class CandidateShortlistedTimelineHandler implements IEventHandler<CandidateShortlistedEvent> {
  async handle(event: CandidateShortlistedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Candidate Shortlisted",
        description: "Candidate was shortlisted for further evaluations.",
        performedById: event.performedById,
      },
    });

    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "SHORTLISTED",
        title: "Shortlisted",
        description: "Candidate shortlisted.",
        performedById: event.performedById,
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CandidateHired Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class CandidateHiredTimelineHandler implements IEventHandler<CandidateHiredEvent> {
  async handle(event: CandidateHiredEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Candidate Hired",
        description: `Hired successfully for Job "${event.jobId}"!`,
        performedById: event.performedById,
        metadata: { jobId: event.jobId },
      },
    });

    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "HIRED",
        title: "Hired",
        description: "Application successfully hired!",
        performedById: event.performedById,
      },
    });
  }
}

export class CandidateHiredAuditHandler implements IEventHandler<CandidateHiredEvent> {
  async handle(event: CandidateHiredEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "PIPELINE",
        entityId: event.pipelineId,
        action: "HIRE",
        performedById: event.performedById,
        metadata: { jobId: event.jobId },
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ReminderCreated Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class ReminderCreatedNotificationHandler implements IEventHandler<ReminderCreatedEvent> {
  async handle(event: ReminderCreatedEvent): Promise<void> {
    await prisma.notification.create({
      data: {
        tenantId: event.tenantId,
        recipientId: event.userId,
        type: "PIPELINE_REMINDER",
        title: `Reminder: ${event.reminderType}`,
        body: `Reminder scheduled for candidate: ${event.remindAt.toISOString()}`,
        entityType: "PIPELINE",
        entityId: event.pipelineId,
        scheduledFor: event.remindAt,
      },
    });
  }
}

export class ReminderCreatedTimelineHandler implements IEventHandler<ReminderCreatedEvent> {
  async handle(event: ReminderCreatedEvent): Promise<void> {
    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "REMINDER_CREATED",
        title: "Reminder Scheduled",
        description: `A ${event.reminderType} reminder was scheduled for user.`,
        performedById: event.performedById,
        metadata: { reminderId: event.reminderId, userId: event.userId, remindAt: event.remindAt },
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RatingUpdated Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class RatingUpdatedTimelineHandler implements IEventHandler<RatingUpdatedEvent> {
  async handle(event: RatingUpdatedEvent): Promise<void> {
    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "RATING_UPDATED",
        title: "Ratings Updated",
        description: "Candidate rating scores were updated.",
        performedById: event.performedById,
        metadata: {
          recruiterRating: event.recruiterRating,
          technicalRating: event.technicalRating,
          hrRating: event.hrRating,
          overallRating: event.overallRating,
        },
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics (Mock/Log) Handler
// ─────────────────────────────────────────────────────────────────────────────
export class PipelineAnalyticsHandler implements IEventHandler<any> {
  async handle(event: any): Promise<void> {
    logger.info(`Analytics: Event processed [${event.eventName}] ID: ${event.eventId}`);
  }
}
