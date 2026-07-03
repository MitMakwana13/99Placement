import { prisma } from "@workspace/db-prisma";
import { IEventHandler } from "../domain-event";
import {
  InterviewScheduledEvent,
  InterviewRescheduledEvent,
  InterviewCancelledEvent,
  InterviewCompletedEvent,
  InterviewNoShowEvent,
  InterviewFeedbackSubmittedEvent,
  OfferCreatedEvent,
  OfferApprovedEvent,
  OfferReleasedEvent,
  OfferAcceptedEvent,
  OfferDeclinedEvent,
  OfferRevokedEvent,
  JoiningScheduledEvent,
  CandidateJoinedEvent,
  CandidateNoShowEvent,
  JoiningFollowupCreatedEvent,
} from "./hiring-decision.events";
import { logger } from "../../config/logger";

// ── Interview Handlers ────────────────────────────────────────────────────────

export class InterviewScheduledTimelineHandler implements IEventHandler<InterviewScheduledEvent> {
  async handle(event: InterviewScheduledEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Interview Scheduled",
        description: `Interview "${event.title}" (Round ${event.roundNumber}) scheduled for ${event.scheduledAt.toISOString()}.`,
        performedById: event.performedById,
        metadata: { interviewId: event.interviewId, pipelineId: event.pipelineId, roundNumber: event.roundNumber },
      },
    });

    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "INTERVIEW_SCHEDULED",
        title: `Interview Scheduled - Round ${event.roundNumber}`,
        description: `Interview "${event.title}" scheduled for ${event.scheduledAt.toISOString()}.`,
        performedById: event.performedById,
        metadata: { interviewId: event.interviewId },
      },
    });
  }
}

export class InterviewScheduledAuditHandler implements IEventHandler<InterviewScheduledEvent> {
  async handle(event: InterviewScheduledEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "INTERVIEW",
        entityId: event.interviewId,
        action: "SCHEDULE",
        performedById: event.performedById,
        metadata: { pipelineId: event.pipelineId, roundNumber: event.roundNumber, title: event.title },
      },
    });
  }
}

export class InterviewRescheduledTimelineHandler implements IEventHandler<InterviewRescheduledEvent> {
  async handle(event: InterviewRescheduledEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Interview Rescheduled",
        description: `Interview rescheduled to ${event.newScheduledAt.toISOString()}.`,
        performedById: event.performedById,
        metadata: { interviewId: event.interviewId, oldScheduledAt: event.oldScheduledAt, newScheduledAt: event.newScheduledAt },
      },
    });
  }
}

export class InterviewCancelledTimelineHandler implements IEventHandler<InterviewCancelledEvent> {
  async handle(event: InterviewCancelledEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Interview Cancelled",
        description: `Interview cancelled. Reason: ${event.reason}`,
        performedById: event.performedById,
        metadata: { interviewId: event.interviewId, reason: event.reason },
      },
    });
  }
}

export class InterviewCompletedTimelineHandler implements IEventHandler<InterviewCompletedEvent> {
  async handle(event: InterviewCompletedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Interview Completed",
        description: `Interview marked as completed at ${event.completedAt.toISOString()}.`,
        performedById: event.performedById,
        metadata: { interviewId: event.interviewId },
      },
    });
  }
}

export class InterviewNoShowTimelineHandler implements IEventHandler<InterviewNoShowEvent> {
  async handle(event: InterviewNoShowEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Interview Candidate No Show",
        description: `Candidate did not show up for interview. Logged at ${event.noShowAt.toISOString()}.`,
        performedById: event.performedById,
        metadata: { interviewId: event.interviewId },
      },
    });
  }
}

export class InterviewFeedbackSubmittedTimelineHandler implements IEventHandler<InterviewFeedbackSubmittedEvent> {
  async handle(event: InterviewFeedbackSubmittedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Interview Feedback Submitted",
        description: `Interviewer submitted feedback. Overall rating: ${event.overallRating}/10. Verdict: ${event.recommendation}.`,
        performedById: event.performedById,
        metadata: { interviewId: event.interviewId, feedbackId: event.feedbackId, rating: event.overallRating, verdict: event.recommendation },
      },
    });
  }
}

// ── Offer Handlers ────────────────────────────────────────────────────────────

export class OfferCreatedTimelineHandler implements IEventHandler<OfferCreatedEvent> {
  async handle(event: OfferCreatedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Offer Proposed (Draft)",
        description: `Offer drafted for Designation: "${event.designation}" with CTC ${event.offeredCtc}. Expected Joining: ${event.joiningDate.toISOString()}.`,
        performedById: event.performedById,
        metadata: { offerId: event.offerId, offeredCtc: event.offeredCtc, designation: event.designation },
      },
    });
  }
}

export class OfferApprovedTimelineHandler implements IEventHandler<OfferApprovedEvent> {
  async handle(event: OfferApprovedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Offer Approved",
        description: `Offer approved by ${event.approverId}.`,
        performedById: event.performedById,
        metadata: { offerId: event.offerId, approverId: event.approverId },
      },
    });
  }
}

export class OfferReleasedTimelineHandler implements IEventHandler<OfferReleasedEvent> {
  async handle(event: OfferReleasedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Offer Released",
        description: `Offer released/sent to candidate.`,
        performedById: event.performedById,
        metadata: { offerId: event.offerId },
      },
    });

    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "OFFER_SENT",
        title: "Offer Letter Sent",
        description: `Formal job offer released to candidate.`,
        performedById: event.performedById,
        metadata: { offerId: event.offerId },
      },
    });
  }
}

export class OfferAcceptedTimelineHandler implements IEventHandler<OfferAcceptedEvent> {
  async handle(event: OfferAcceptedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Offer Accepted by Candidate",
        description: `Candidate accepted the offer at ${event.acceptedAt.toISOString()}. Onboarding / pre-joining checks initiated.`,
        performedById: event.performedById,
        metadata: { offerId: event.offerId },
      },
    });

    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "OFFER_ACCEPTED",
        title: "Offer Accepted",
        description: `Offer accepted by candidate.`,
        performedById: event.performedById,
        metadata: { offerId: event.offerId },
      },
    });
  }
}

export class OfferDeclinedTimelineHandler implements IEventHandler<OfferDeclinedEvent> {
  async handle(event: OfferDeclinedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Offer Declined by Candidate",
        description: event.reason ? `Offer declined. Reason: ${event.reason}` : "Offer declined by candidate.",
        performedById: event.performedById,
        metadata: { offerId: event.offerId, reason: event.reason },
      },
    });
  }
}

export class OfferRevokedTimelineHandler implements IEventHandler<OfferRevokedEvent> {
  async handle(event: OfferRevokedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Offer Revoked",
        description: event.reason ? `Offer revoked by company. Reason: ${event.reason}` : "Offer revoked by company.",
        performedById: event.performedById,
        metadata: { offerId: event.offerId, reason: event.reason },
      },
    });
  }
}

// ── Joining Handlers ──────────────────────────────────────────────────────────

export class JoiningScheduledTimelineHandler implements IEventHandler<JoiningScheduledEvent> {
  async handle(event: JoiningScheduledEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Pre-joining Onboarding Scheduled",
        description: `Pre-joining scheduled with expected joining date: ${event.joiningDate.toISOString()}. Pre-joining checklists, documents collection and BGV initiated.`,
        performedById: event.performedById,
        metadata: { joiningId: event.joiningId, joiningDate: event.joiningDate },
      },
    });
  }
}

export class CandidateJoinedTimelineHandler implements IEventHandler<CandidateJoinedEvent> {
  async handle(event: CandidateJoinedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Candidate Onboarded (Joined)",
        description: `Candidate successfully joined the company on ${event.actualJoinedAt.toISOString()}.`,
        performedById: event.performedById,
        metadata: { joiningId: event.joiningId, actualJoinedAt: event.actualJoinedAt },
      },
    });

    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "HIRED",
        title: "Candidate Joined",
        description: `Candidate onboarded on ${event.actualJoinedAt.toISOString()}.`,
        performedById: event.performedById,
        metadata: { joiningId: event.joiningId },
      },
    });
  }
}

export class CandidateNoShowTimelineHandler implements IEventHandler<CandidateNoShowEvent> {
  async handle(event: CandidateNoShowEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Onboarding No Show",
        description: `Candidate marked as NO SHOW on the scheduled joining date.`,
        performedById: event.performedById,
        metadata: { joiningId: event.joiningId },
      },
    });
  }
}

export class JoiningFollowupCreatedTimelineHandler implements IEventHandler<JoiningFollowupCreatedEvent> {
  async handle(event: JoiningFollowupCreatedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Post-joining Follow-up Created",
        description: `Post-joining follow-up created for type: "${event.checkType}".`,
        performedById: event.performedById,
        metadata: { followupId: event.followupId },
      },
    });
  }
}
