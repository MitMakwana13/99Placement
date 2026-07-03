import { prisma } from "@workspace/db-prisma";
import { IEventHandler } from "../domain-event";
import {
  ScreeningScheduledEvent,
  ScreeningConductedEvent,
  ScreeningShortlistedEvent,
  ScreeningRejectedEvent,
  ScreeningRescheduledEvent,
  ScreeningCancelledEvent,
} from "./screening.events";
import logger from "../../lib/logger";

// ─────────────────────────────────────────────────────────────────────────────
// ScreeningScheduled Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class ScreeningScheduledTimelineHandler implements IEventHandler<ScreeningScheduledEvent> {
  async handle(event: ScreeningScheduledEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Screening Interview Scheduled",
        description: `Internal screening interview scheduled for ${event.scheduledAt.toISOString()} via ${event.mode}.`,
        performedById: event.performedById,
        metadata: { screeningId: event.screeningId, pipelineId: event.pipelineId, scheduledAt: event.scheduledAt },
      },
    });

    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "SCREENING_SCHEDULED",
        title: "Screening Scheduled",
        description: `Internal 99 Placement screening scheduled for ${event.scheduledAt.toISOString()}.`,
        performedById: event.performedById,
        metadata: { screeningId: event.screeningId, interviewerId: event.interviewerId },
      },
    });
  }
}

export class ScreeningScheduledAuditHandler implements IEventHandler<ScreeningScheduledEvent> {
  async handle(event: ScreeningScheduledEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "SCREENING",
        entityId: event.screeningId,
        action: "SCHEDULE",
        performedById: event.performedById,
        metadata: { pipelineId: event.pipelineId, scheduledAt: event.scheduledAt, mode: event.mode },
      },
    });
  }
}

export class ScreeningScheduledNotificationHandler implements IEventHandler<ScreeningScheduledEvent> {
  async handle(event: ScreeningScheduledEvent): Promise<void> {
    await prisma.notification.create({
      data: {
        tenantId: event.tenantId,
        recipientId: event.interviewerId,
        type: "SCREENING_ASSIGNED",
        title: "Screening Interview Assigned",
        body: `You have been assigned to conduct a screening interview on ${event.scheduledAt.toISOString()}.`,
        entityType: "SCREENING",
        entityId: event.screeningId,
        scheduledFor: event.scheduledAt,
      },
    });
  }
}

export class ScreeningScheduledAnalyticsHandler implements IEventHandler<ScreeningScheduledEvent> {
  async handle(event: ScreeningScheduledEvent): Promise<void> {
    logger.info(`Analytics: [${event.eventName}] screeningId=${event.screeningId}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ScreeningConducted Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class ScreeningConductedTimelineHandler implements IEventHandler<ScreeningConductedEvent> {
  async handle(event: ScreeningConductedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Screening Interview Completed",
        description: `Internal screening completed. Overall score: ${event.overallScore}/10. Verdict: ${event.verdict}.`,
        performedById: event.performedById,
        metadata: { screeningId: event.screeningId, overallScore: event.overallScore, verdict: event.verdict },
      },
    });

    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "SCREENING_COMPLETED",
        title: "Screening Completed",
        description: `Screening conducted. Score: ${event.overallScore}/10. Verdict: ${event.verdict}.`,
        performedById: event.performedById,
        metadata: { screeningId: event.screeningId, overallScore: event.overallScore, verdict: event.verdict },
      },
    });
  }
}

export class ScreeningConductedAuditHandler implements IEventHandler<ScreeningConductedEvent> {
  async handle(event: ScreeningConductedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "SCREENING",
        entityId: event.screeningId,
        action: "CONDUCT",
        performedById: event.performedById,
        metadata: { overallScore: event.overallScore, verdict: event.verdict },
      },
    });
  }
}

export class ScreeningConductedNotificationHandler implements IEventHandler<ScreeningConductedEvent> {
  async handle(event: ScreeningConductedEvent): Promise<void> {
    logger.info(`Analytics: [${event.eventName}] screeningId=${event.screeningId} score=${event.overallScore}`);
  }
}

export class ScreeningConductedAnalyticsHandler implements IEventHandler<ScreeningConductedEvent> {
  async handle(event: ScreeningConductedEvent): Promise<void> {
    logger.info(`Analytics: [${event.eventName}] screeningId=${event.screeningId}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ScreeningShortlisted Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class ScreeningShortlistedTimelineHandler implements IEventHandler<ScreeningShortlistedEvent> {
  async handle(event: ScreeningShortlistedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Shortlisted After Screening",
        description: `Candidate shortlisted after internal screening with score ${event.overallScore}/10. Ready for assessment.`,
        performedById: event.performedById,
        metadata: { screeningId: event.screeningId, overallScore: event.overallScore },
      },
    });

    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "SCREENING_SHORTLISTED",
        title: "Shortlisted After Screening",
        description: "Candidate passed internal screening and is shortlisted for assessment.",
        performedById: event.performedById,
        metadata: { screeningId: event.screeningId },
      },
    });
  }
}

export class ScreeningShortlistedAuditHandler implements IEventHandler<ScreeningShortlistedEvent> {
  async handle(event: ScreeningShortlistedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "SCREENING",
        entityId: event.screeningId,
        action: "SHORTLIST",
        performedById: event.performedById,
        metadata: { pipelineId: event.pipelineId, overallScore: event.overallScore },
      },
    });
  }
}

export class ScreeningShortlistedNotificationHandler implements IEventHandler<ScreeningShortlistedEvent> {
  async handle(event: ScreeningShortlistedEvent): Promise<void> {
    logger.info(`Notification: Candidate shortlisted after screening [${event.screeningId}]`);
  }
}

export class ScreeningShortlistedAnalyticsHandler implements IEventHandler<ScreeningShortlistedEvent> {
  async handle(event: ScreeningShortlistedEvent): Promise<void> {
    logger.info(`Analytics: [${event.eventName}] screeningId=${event.screeningId}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ScreeningRejected Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class ScreeningRejectedTimelineHandler implements IEventHandler<ScreeningRejectedEvent> {
  async handle(event: ScreeningRejectedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Rejected at Internal Screening",
        description: event.reason
          ? `Rejected at screening stage: ${event.reason}`
          : "Candidate did not pass the internal 99 Placement screening.",
        performedById: event.performedById,
        metadata: { screeningId: event.screeningId, reason: event.reason },
      },
    });

    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "SCREENING_REJECTED",
        title: "Rejected at Screening",
        description: event.reason ? `Rejected: ${event.reason}` : "Did not meet screening criteria.",
        performedById: event.performedById,
        metadata: { screeningId: event.screeningId, reason: event.reason },
      },
    });
  }
}

export class ScreeningRejectedAuditHandler implements IEventHandler<ScreeningRejectedEvent> {
  async handle(event: ScreeningRejectedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "SCREENING",
        entityId: event.screeningId,
        action: "REJECT",
        performedById: event.performedById,
        metadata: { pipelineId: event.pipelineId, reason: event.reason },
      },
    });
  }
}

export class ScreeningRejectedNotificationHandler implements IEventHandler<ScreeningRejectedEvent> {
  async handle(event: ScreeningRejectedEvent): Promise<void> {
    logger.info(`Notification: Candidate rejected at screening [${event.screeningId}]`);
  }
}

export class ScreeningRejectedAnalyticsHandler implements IEventHandler<ScreeningRejectedEvent> {
  async handle(event: ScreeningRejectedEvent): Promise<void> {
    logger.info(`Analytics: [${event.eventName}] screeningId=${event.screeningId}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ScreeningRescheduled Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class ScreeningRescheduledTimelineHandler implements IEventHandler<ScreeningRescheduledEvent> {
  async handle(event: ScreeningRescheduledEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Screening Interview Rescheduled",
        description: `Screening rescheduled to ${event.newScheduledAt.toISOString()}.`,
        performedById: event.performedById,
        metadata: { screeningId: event.screeningId, oldScheduledAt: event.oldScheduledAt, newScheduledAt: event.newScheduledAt },
      },
    });
  }
}

export class ScreeningRescheduledAuditHandler implements IEventHandler<ScreeningRescheduledEvent> {
  async handle(event: ScreeningRescheduledEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "SCREENING",
        entityId: event.screeningId,
        action: "RESCHEDULE",
        performedById: event.performedById,
        metadata: { oldScheduledAt: event.oldScheduledAt, newScheduledAt: event.newScheduledAt },
      },
    });
  }
}

export class ScreeningRescheduledNotificationHandler implements IEventHandler<ScreeningRescheduledEvent> {
  async handle(event: ScreeningRescheduledEvent): Promise<void> {
    logger.info(`Notification: Screening rescheduled [${event.screeningId}] to ${event.newScheduledAt}`);
  }
}

export class ScreeningRescheduledAnalyticsHandler implements IEventHandler<ScreeningRescheduledEvent> {
  async handle(event: ScreeningRescheduledEvent): Promise<void> {
    logger.info(`Analytics: [${event.eventName}] screeningId=${event.screeningId}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ScreeningCancelled Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class ScreeningCancelledTimelineHandler implements IEventHandler<ScreeningCancelledEvent> {
  async handle(event: ScreeningCancelledEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Screening Interview Cancelled",
        description: event.reason ? `Screening cancelled: ${event.reason}` : "Screening interview was cancelled.",
        performedById: event.performedById,
        metadata: { screeningId: event.screeningId, reason: event.reason },
      },
    });
  }
}

export class ScreeningCancelledAuditHandler implements IEventHandler<ScreeningCancelledEvent> {
  async handle(event: ScreeningCancelledEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "SCREENING",
        entityId: event.screeningId,
        action: "CANCEL",
        performedById: event.performedById,
        metadata: { reason: event.reason },
      },
    });
  }
}

export class ScreeningCancelledNotificationHandler implements IEventHandler<ScreeningCancelledEvent> {
  async handle(event: ScreeningCancelledEvent): Promise<void> {
    logger.info(`Notification: Screening cancelled [${event.screeningId}]`);
  }
}

export class ScreeningCancelledAnalyticsHandler implements IEventHandler<ScreeningCancelledEvent> {
  async handle(event: ScreeningCancelledEvent): Promise<void> {
    logger.info(`Analytics: [${event.eventName}] screeningId=${event.screeningId}`);
  }
}
