/**
 * Event Bus Bootstrap
 *
 * This is the SINGLE place where handlers are registered against the bus.
 *
 * Architecture decisions:
 *
 * 1. SEPARATION OF REGISTRATION FROM INSTANTIATION
 *    The bus (event-bus.ts) knows nothing about specific domains.
 *    This file wires them together at startup. This keeps the bus
 *    framework-agnostic and domain modules fully decoupled.
 *
 * 2. EXPLICIT ORDERING
 *    Handlers registered first run first. Timeline handlers are
 *    always registered before audit handlers to preserve natural
 *    chronological ordering in the UI.
 *
 * 3. SINGLE IMPORT IN server.ts / app.ts
 *    Only `bootstrapEventHandlers()` needs to be called once at startup.
 *    All domain modules register here — never directly in services.
 *
 * 4. FUTURE DOMAIN MODULES
 *    When adding Pipeline, Assessment, Offer domains — just add their
 *    register*Handlers() calls here. Zero changes to the bus itself.
 */

import { domainEventBus } from "./event-bus";

// ── Assessment ──
import {
  AssessmentAssignedEvent,
  AssessmentStartedEvent,
  AssessmentSubmittedEvent,
  AssessmentEvaluatedEvent,
} from "./assessment/assessment.events";
import {
  AssessmentAssignedTimelineHandler,
  AssessmentAssignedAuditHandler,
  AssessmentAssignedNotificationHandler,
  AssessmentAssignedAnalyticsHandler,
  AssessmentStartedTimelineHandler,
  AssessmentStartedAuditHandler,
  AssessmentStartedNotificationHandler,
  AssessmentStartedAnalyticsHandler,
  AssessmentSubmittedTimelineHandler,
  AssessmentSubmittedAuditHandler,
  AssessmentSubmittedNotificationHandler,
  AssessmentSubmittedAnalyticsHandler,
  AssessmentEvaluatedTimelineHandler,
  AssessmentEvaluatedAuditHandler,
  AssessmentEvaluatedNotificationHandler,
  AssessmentEvaluatedAnalyticsHandler,
} from "./assessment/assessment.handlers";


// ── Candidate ──
import {
  CandidateCreatedEvent,
  CandidateUpdatedEvent,
  CandidateDeletedEvent,
  CandidateRestoredEvent,
  CandidateMergedEvent,
} from "./candidate/candidate.events";
import {
  CandidateCreatedTimelineHandler,
  CandidateCreatedAuditHandler,
  CandidateUpdatedTimelineHandler,
  CandidateUpdatedAuditHandler,
  CandidateDeletedTimelineHandler,
  CandidateDeletedAuditHandler,
  CandidateRestoredTimelineHandler,
  CandidateRestoredAuditHandler,
  CandidateMergedTimelineHandler,
  CandidateMergedAuditHandler,
} from "./candidate/candidate.handlers";

// ── Company ──
import {
  CompanyCreatedEvent,
  CompanyUpdatedEvent,
  CompanyArchivedEvent,
  CompanyRestoredEvent,
  CompanyMergedEvent,
  RecruiterAssignedEvent,
  ContactCreatedEvent,
} from "./company/company.events";
import {
  CompanyCreatedTimelineHandler,
  CompanyCreatedAuditHandler,
  CompanyUpdatedTimelineHandler,
  CompanyUpdatedAuditHandler,
  CompanyArchivedTimelineHandler,
  CompanyArchivedAuditHandler,
  CompanyRestoredTimelineHandler,
  CompanyRestoredAuditHandler,
  CompanyMergedTimelineHandler,
  CompanyMergedAuditHandler,
  RecruiterAssignedTimelineHandler,
  RecruiterAssignedAuditHandler,
  ContactCreatedTimelineHandler,
  ContactCreatedAuditHandler,
} from "./company/company.handlers";

// ── Job ──
import {
  JobCreatedEvent,
  JobUpdatedEvent,
  JobClosedEvent,
  JobOpenedEvent,
  JobArchivedEvent,
  JobRestoredEvent,
  JobAssignedEvent,
  JobApprovedEvent,
  JobClonedEvent,
} from "./job/job.events";
import {
  JobCreatedTimelineHandler,
  JobCreatedAuditHandler,
  JobUpdatedTimelineHandler,
  JobUpdatedAuditHandler,
  JobClosedTimelineHandler,
  JobClosedAuditHandler,
  JobOpenedTimelineHandler,
  JobArchivedTimelineHandler,
  JobRestoredTimelineHandler,
  JobAssignedTimelineHandler,
  JobAssignedNotificationHandler,
  JobApprovedTimelineHandler,
  JobApprovedAuditHandler,
  JobClonedTimelineHandler,
} from "./job/job.handlers";

// ── Pipeline ──
import {
  CandidateAddedToPipelineEvent,
  PipelineStageChangedEvent,
  CandidateRejectedEvent,
  CandidateWithdrawnEvent,
  CandidateShortlistedEvent,
  CandidateHiredEvent,
  ReminderCreatedEvent,
  RatingUpdatedEvent,
} from "./pipeline/pipeline.events";
import {
  CandidateAddedToPipelineTimelineHandler,
  CandidateAddedToPipelineAuditHandler,
  PipelineStageChangedTimelineHandler,
  PipelineStageChangedAuditHandler,
  CandidateRejectedTimelineHandler,
  CandidateRejectedAuditHandler,
  CandidateWithdrawnTimelineHandler,
  CandidateWithdrawnAuditHandler,
  CandidateShortlistedTimelineHandler,
  CandidateHiredTimelineHandler,
  CandidateHiredAuditHandler,
  ReminderCreatedNotificationHandler,
  ReminderCreatedTimelineHandler,
  RatingUpdatedTimelineHandler,
  PipelineAnalyticsHandler,
} from "./pipeline/pipeline.handlers";

// ── Internal Screening ──
import {
  ScreeningScheduledEvent,
  ScreeningConductedEvent,
  ScreeningShortlistedEvent,
  ScreeningRejectedEvent,
  ScreeningRescheduledEvent,
  ScreeningCancelledEvent,
} from "./screening/screening.events";
import {
  ScreeningScheduledTimelineHandler,
  ScreeningScheduledAuditHandler,
  ScreeningScheduledNotificationHandler,
  ScreeningScheduledAnalyticsHandler,
  ScreeningConductedTimelineHandler,
  ScreeningConductedAuditHandler,
  ScreeningConductedNotificationHandler,
  ScreeningConductedAnalyticsHandler,
  ScreeningShortlistedTimelineHandler,
  ScreeningShortlistedAuditHandler,
  ScreeningShortlistedNotificationHandler,
  ScreeningShortlistedAnalyticsHandler,
  ScreeningRejectedTimelineHandler,
  ScreeningRejectedAuditHandler,
  ScreeningRejectedNotificationHandler,
  ScreeningRejectedAnalyticsHandler,
  ScreeningRescheduledTimelineHandler,
  ScreeningRescheduledAuditHandler,
  ScreeningRescheduledNotificationHandler,
  ScreeningRescheduledAnalyticsHandler,
  ScreeningCancelledTimelineHandler,
  ScreeningCancelledAuditHandler,
  ScreeningCancelledNotificationHandler,
  ScreeningCancelledAnalyticsHandler,
} from "./screening/screening.handlers";

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
} from "./hiring-decision/hiring-decision.events";
import {
  InterviewScheduledTimelineHandler,
  InterviewScheduledAuditHandler,
  InterviewRescheduledTimelineHandler,
  InterviewCancelledTimelineHandler,
  InterviewCompletedTimelineHandler,
  InterviewNoShowTimelineHandler,
  InterviewFeedbackSubmittedTimelineHandler,
  OfferCreatedTimelineHandler,
  OfferApprovedTimelineHandler,
  OfferReleasedTimelineHandler,
  OfferAcceptedTimelineHandler,
  OfferDeclinedTimelineHandler,
  OfferRevokedTimelineHandler,
  JoiningScheduledTimelineHandler,
  CandidateJoinedTimelineHandler,
  CandidateNoShowTimelineHandler,
  JoiningFollowupCreatedTimelineHandler,
} from "./hiring-decision/hiring-decision.handlers";

import { logger } from "../config/logger";

function registerCandidateHandlers(): void {
  domainEventBus.subscribe(CandidateCreatedEvent.prototype.eventName,  new CandidateCreatedTimelineHandler());
  domainEventBus.subscribe(CandidateCreatedEvent.prototype.eventName,  new CandidateCreatedAuditHandler());
  domainEventBus.subscribe(CandidateUpdatedEvent.prototype.eventName,  new CandidateUpdatedTimelineHandler());
  domainEventBus.subscribe(CandidateUpdatedEvent.prototype.eventName,  new CandidateUpdatedAuditHandler());
  domainEventBus.subscribe(CandidateDeletedEvent.prototype.eventName,  new CandidateDeletedTimelineHandler());
  domainEventBus.subscribe(CandidateDeletedEvent.prototype.eventName,  new CandidateDeletedAuditHandler());
  domainEventBus.subscribe(CandidateRestoredEvent.prototype.eventName, new CandidateRestoredTimelineHandler());
  domainEventBus.subscribe(CandidateRestoredEvent.prototype.eventName, new CandidateRestoredAuditHandler());
  domainEventBus.subscribe(CandidateMergedEvent.prototype.eventName,   new CandidateMergedTimelineHandler());
  domainEventBus.subscribe(CandidateMergedEvent.prototype.eventName,   new CandidateMergedAuditHandler());
}

function registerCompanyHandlers(): void {
  domainEventBus.subscribe(CompanyCreatedEvent.prototype.eventName,    new CompanyCreatedTimelineHandler());
  domainEventBus.subscribe(CompanyCreatedEvent.prototype.eventName,    new CompanyCreatedAuditHandler());
  domainEventBus.subscribe(CompanyUpdatedEvent.prototype.eventName,    new CompanyUpdatedTimelineHandler());
  domainEventBus.subscribe(CompanyUpdatedEvent.prototype.eventName,    new CompanyUpdatedAuditHandler());
  domainEventBus.subscribe(CompanyArchivedEvent.prototype.eventName,   new CompanyArchivedTimelineHandler());
  domainEventBus.subscribe(CompanyArchivedEvent.prototype.eventName,   new CompanyArchivedAuditHandler());
  domainEventBus.subscribe(CompanyRestoredEvent.prototype.eventName,   new CompanyRestoredTimelineHandler());
  domainEventBus.subscribe(CompanyRestoredEvent.prototype.eventName,   new CompanyRestoredAuditHandler());
  domainEventBus.subscribe(CompanyMergedEvent.prototype.eventName,     new CompanyMergedTimelineHandler());
  domainEventBus.subscribe(CompanyMergedEvent.prototype.eventName,     new CompanyMergedAuditHandler());
  domainEventBus.subscribe(RecruiterAssignedEvent.prototype.eventName, new RecruiterAssignedTimelineHandler());
  domainEventBus.subscribe(RecruiterAssignedEvent.prototype.eventName, new RecruiterAssignedAuditHandler());
  domainEventBus.subscribe(ContactCreatedEvent.prototype.eventName,    new ContactCreatedTimelineHandler());
  domainEventBus.subscribe(ContactCreatedEvent.prototype.eventName,    new ContactCreatedAuditHandler());
}

function registerJobHandlers(): void {
  domainEventBus.subscribe(JobCreatedEvent.prototype.eventName,   new JobCreatedTimelineHandler());
  domainEventBus.subscribe(JobCreatedEvent.prototype.eventName,   new JobCreatedAuditHandler());
  domainEventBus.subscribe(JobUpdatedEvent.prototype.eventName,   new JobUpdatedTimelineHandler());
  domainEventBus.subscribe(JobUpdatedEvent.prototype.eventName,   new JobUpdatedAuditHandler());
  domainEventBus.subscribe(JobClosedEvent.prototype.eventName,    new JobClosedTimelineHandler());
  domainEventBus.subscribe(JobClosedEvent.prototype.eventName,    new JobClosedAuditHandler());
  domainEventBus.subscribe(JobOpenedEvent.prototype.eventName,    new JobOpenedTimelineHandler());
  domainEventBus.subscribe(JobArchivedEvent.prototype.eventName,  new JobArchivedTimelineHandler());
  domainEventBus.subscribe(JobRestoredEvent.prototype.eventName,  new JobRestoredTimelineHandler());
  domainEventBus.subscribe(JobAssignedEvent.prototype.eventName,  new JobAssignedTimelineHandler());
  domainEventBus.subscribe(JobAssignedEvent.prototype.eventName,  new JobAssignedNotificationHandler());
  domainEventBus.subscribe(JobApprovedEvent.prototype.eventName,  new JobApprovedTimelineHandler());
  domainEventBus.subscribe(JobApprovedEvent.prototype.eventName,  new JobApprovedAuditHandler());
  domainEventBus.subscribe(JobClonedEvent.prototype.eventName,    new JobClonedTimelineHandler());
}

function registerPipelineHandlers(): void {
  const analytics = new PipelineAnalyticsHandler();
  
  domainEventBus.subscribe(CandidateAddedToPipelineEvent.prototype.eventName, new CandidateAddedToPipelineTimelineHandler());
  domainEventBus.subscribe(CandidateAddedToPipelineEvent.prototype.eventName, new CandidateAddedToPipelineAuditHandler());
  domainEventBus.subscribe(CandidateAddedToPipelineEvent.prototype.eventName, analytics);

  domainEventBus.subscribe(PipelineStageChangedEvent.prototype.eventName, new PipelineStageChangedTimelineHandler());
  domainEventBus.subscribe(PipelineStageChangedEvent.prototype.eventName, new PipelineStageChangedAuditHandler());
  domainEventBus.subscribe(PipelineStageChangedEvent.prototype.eventName, analytics);

  domainEventBus.subscribe(CandidateRejectedEvent.prototype.eventName, new CandidateRejectedTimelineHandler());
  domainEventBus.subscribe(CandidateRejectedEvent.prototype.eventName, new CandidateRejectedAuditHandler());
  domainEventBus.subscribe(CandidateRejectedEvent.prototype.eventName, analytics);

  domainEventBus.subscribe(CandidateWithdrawnEvent.prototype.eventName, new CandidateWithdrawnTimelineHandler());
  domainEventBus.subscribe(CandidateWithdrawnEvent.prototype.eventName, new CandidateWithdrawnAuditHandler());
  domainEventBus.subscribe(CandidateWithdrawnEvent.prototype.eventName, analytics);

  domainEventBus.subscribe(CandidateShortlistedEvent.prototype.eventName, new CandidateShortlistedTimelineHandler());
  domainEventBus.subscribe(CandidateShortlistedEvent.prototype.eventName, analytics);

  domainEventBus.subscribe(CandidateHiredEvent.prototype.eventName, new CandidateHiredTimelineHandler());
  domainEventBus.subscribe(CandidateHiredEvent.prototype.eventName, new CandidateHiredAuditHandler());
  domainEventBus.subscribe(CandidateHiredEvent.prototype.eventName, analytics);

  domainEventBus.subscribe(ReminderCreatedEvent.prototype.eventName, new ReminderCreatedNotificationHandler());
  domainEventBus.subscribe(ReminderCreatedEvent.prototype.eventName, new ReminderCreatedTimelineHandler());
  domainEventBus.subscribe(ReminderCreatedEvent.prototype.eventName, analytics);

  domainEventBus.subscribe(RatingUpdatedEvent.prototype.eventName, new RatingUpdatedTimelineHandler());
  domainEventBus.subscribe(RatingUpdatedEvent.prototype.eventName, analytics);
}

function registerScreeningHandlers(): void {
  domainEventBus.subscribe(ScreeningScheduledEvent.prototype.eventName,   new ScreeningScheduledTimelineHandler());
  domainEventBus.subscribe(ScreeningScheduledEvent.prototype.eventName,   new ScreeningScheduledAuditHandler());
  domainEventBus.subscribe(ScreeningScheduledEvent.prototype.eventName,   new ScreeningScheduledNotificationHandler());
  domainEventBus.subscribe(ScreeningScheduledEvent.prototype.eventName,   new ScreeningScheduledAnalyticsHandler());

  domainEventBus.subscribe(ScreeningConductedEvent.prototype.eventName,   new ScreeningConductedTimelineHandler());
  domainEventBus.subscribe(ScreeningConductedEvent.prototype.eventName,   new ScreeningConductedAuditHandler());
  domainEventBus.subscribe(ScreeningConductedEvent.prototype.eventName,   new ScreeningConductedNotificationHandler());
  domainEventBus.subscribe(ScreeningConductedEvent.prototype.eventName,   new ScreeningConductedAnalyticsHandler());

  domainEventBus.subscribe(ScreeningShortlistedEvent.prototype.eventName, new ScreeningShortlistedTimelineHandler());
  domainEventBus.subscribe(ScreeningShortlistedEvent.prototype.eventName, new ScreeningShortlistedAuditHandler());
  domainEventBus.subscribe(ScreeningShortlistedEvent.prototype.eventName, new ScreeningShortlistedNotificationHandler());
  domainEventBus.subscribe(ScreeningShortlistedEvent.prototype.eventName, new ScreeningShortlistedAnalyticsHandler());

  domainEventBus.subscribe(ScreeningRejectedEvent.prototype.eventName,    new ScreeningRejectedTimelineHandler());
  domainEventBus.subscribe(ScreeningRejectedEvent.prototype.eventName,    new ScreeningRejectedAuditHandler());
  domainEventBus.subscribe(ScreeningRejectedEvent.prototype.eventName,    new ScreeningRejectedNotificationHandler());
  domainEventBus.subscribe(ScreeningRejectedEvent.prototype.eventName,    new ScreeningRejectedAnalyticsHandler());

  domainEventBus.subscribe(ScreeningRescheduledEvent.prototype.eventName, new ScreeningRescheduledTimelineHandler());
  domainEventBus.subscribe(ScreeningRescheduledEvent.prototype.eventName, new ScreeningRescheduledAuditHandler());
  domainEventBus.subscribe(ScreeningRescheduledEvent.prototype.eventName, new ScreeningRescheduledNotificationHandler());
  domainEventBus.subscribe(ScreeningRescheduledEvent.prototype.eventName, new ScreeningRescheduledAnalyticsHandler());

  domainEventBus.subscribe(ScreeningCancelledEvent.prototype.eventName,   new ScreeningCancelledTimelineHandler());
  domainEventBus.subscribe(ScreeningCancelledEvent.prototype.eventName,   new ScreeningCancelledAuditHandler());
  domainEventBus.subscribe(ScreeningCancelledEvent.prototype.eventName,   new ScreeningCancelledNotificationHandler());
  domainEventBus.subscribe(ScreeningCancelledEvent.prototype.eventName,   new ScreeningCancelledAnalyticsHandler());
}

function registerAssessmentHandlers(): void {
  domainEventBus.subscribe(AssessmentAssignedEvent.prototype.eventName,   new AssessmentAssignedTimelineHandler());
  domainEventBus.subscribe(AssessmentAssignedEvent.prototype.eventName,   new AssessmentAssignedAuditHandler());
  domainEventBus.subscribe(AssessmentAssignedEvent.prototype.eventName,   new AssessmentAssignedNotificationHandler());
  domainEventBus.subscribe(AssessmentAssignedEvent.prototype.eventName,   new AssessmentAssignedAnalyticsHandler());

  domainEventBus.subscribe(AssessmentStartedEvent.prototype.eventName,    new AssessmentStartedTimelineHandler());
  domainEventBus.subscribe(AssessmentStartedEvent.prototype.eventName,    new AssessmentStartedAuditHandler());
  domainEventBus.subscribe(AssessmentStartedEvent.prototype.eventName,    new AssessmentStartedNotificationHandler());
  domainEventBus.subscribe(AssessmentStartedEvent.prototype.eventName,    new AssessmentStartedAnalyticsHandler());

  domainEventBus.subscribe(AssessmentSubmittedEvent.prototype.eventName,  new AssessmentSubmittedTimelineHandler());
  domainEventBus.subscribe(AssessmentSubmittedEvent.prototype.eventName,  new AssessmentSubmittedAuditHandler());
  domainEventBus.subscribe(AssessmentSubmittedEvent.prototype.eventName,  new AssessmentSubmittedNotificationHandler());
  domainEventBus.subscribe(AssessmentSubmittedEvent.prototype.eventName,  new AssessmentSubmittedAnalyticsHandler());

  domainEventBus.subscribe(AssessmentEvaluatedEvent.prototype.eventName,  new AssessmentEvaluatedTimelineHandler());
  domainEventBus.subscribe(AssessmentEvaluatedEvent.prototype.eventName,  new AssessmentEvaluatedAuditHandler());
  domainEventBus.subscribe(AssessmentEvaluatedEvent.prototype.eventName,  new AssessmentEvaluatedNotificationHandler());
  domainEventBus.subscribe(AssessmentEvaluatedEvent.prototype.eventName,  new AssessmentEvaluatedAnalyticsHandler());
}

function registerHiringDecisionHandlers(): void {
  domainEventBus.subscribe(InterviewScheduledEvent.prototype.eventName, new InterviewScheduledTimelineHandler());
  domainEventBus.subscribe(InterviewScheduledEvent.prototype.eventName, new InterviewScheduledAuditHandler());
  domainEventBus.subscribe(InterviewRescheduledEvent.prototype.eventName, new InterviewRescheduledTimelineHandler());
  domainEventBus.subscribe(InterviewCancelledEvent.prototype.eventName, new InterviewCancelledTimelineHandler());
  domainEventBus.subscribe(InterviewCompletedEvent.prototype.eventName, new InterviewCompletedTimelineHandler());
  domainEventBus.subscribe(InterviewNoShowEvent.prototype.eventName, new InterviewNoShowTimelineHandler());
  domainEventBus.subscribe(InterviewFeedbackSubmittedEvent.prototype.eventName, new InterviewFeedbackSubmittedTimelineHandler());

  domainEventBus.subscribe(OfferCreatedEvent.prototype.eventName, new OfferCreatedTimelineHandler());
  domainEventBus.subscribe(OfferApprovedEvent.prototype.eventName, new OfferApprovedTimelineHandler());
  domainEventBus.subscribe(OfferReleasedEvent.prototype.eventName, new OfferReleasedTimelineHandler());
  domainEventBus.subscribe(OfferAcceptedEvent.prototype.eventName, new OfferAcceptedTimelineHandler());
  domainEventBus.subscribe(OfferDeclinedEvent.prototype.eventName, new OfferDeclinedTimelineHandler());
  domainEventBus.subscribe(OfferRevokedEvent.prototype.eventName, new OfferRevokedTimelineHandler());

  domainEventBus.subscribe(JoiningScheduledEvent.prototype.eventName, new JoiningScheduledTimelineHandler());
  domainEventBus.subscribe(CandidateJoinedEvent.prototype.eventName, new CandidateJoinedTimelineHandler());
  domainEventBus.subscribe(CandidateNoShowEvent.prototype.eventName, new CandidateNoShowTimelineHandler());
  domainEventBus.subscribe(JoiningFollowupCreatedEvent.prototype.eventName, new JoiningFollowupCreatedTimelineHandler());
}

/**
 * Call once during server bootstrap (before routes are mounted).
 */
export function bootstrapEventHandlers(): void {
  // Clear any existing registrations to avoid duplicates during test runs/re-bootstraps
  domainEventBus.clear();

  registerCandidateHandlers();
  registerCompanyHandlers();
  registerJobHandlers();
  registerPipelineHandlers();
  registerScreeningHandlers();
  registerAssessmentHandlers();
  registerHiringDecisionHandlers();

  logger.info("EventBus: all domain event handlers registered");
}

