import { DomainEvent } from "../domain-event";

// ── Interview Events ──────────────────────────────────────────────────────────

export class InterviewScheduledEvent extends DomainEvent {
  get eventName() { return "InterviewScheduled" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly interviewId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly title: string,
    public readonly roundNumber: number,
    public readonly scheduledAt: Date,
    public readonly performedById: string,
  ) { super(); }
}

export class InterviewRescheduledEvent extends DomainEvent {
  get eventName() { return "InterviewRescheduled" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly interviewId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly oldScheduledAt: Date | null,
    public readonly newScheduledAt: Date,
    public readonly performedById: string,
  ) { super(); }
}

export class InterviewCancelledEvent extends DomainEvent {
  get eventName() { return "InterviewCancelled" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly interviewId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly reason: string,
    public readonly performedById: string,
  ) { super(); }
}

export class InterviewCompletedEvent extends DomainEvent {
  get eventName() { return "InterviewCompleted" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly interviewId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly completedAt: Date,
    public readonly performedById: string,
  ) { super(); }
}

export class InterviewNoShowEvent extends DomainEvent {
  get eventName() { return "InterviewNoShow" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly interviewId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly noShowAt: Date,
    public readonly performedById: string,
  ) { super(); }
}

export class InterviewFeedbackSubmittedEvent extends DomainEvent {
  get eventName() { return "InterviewFeedbackSubmitted" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly interviewId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly feedbackId: string,
    public readonly submittedById: string,
    public readonly recommendation: string,
    public readonly overallRating: number,
    public readonly performedById: string,
  ) { super(); }
}

// ── Offer Events ──────────────────────────────────────────────────────────────

export class OfferCreatedEvent extends DomainEvent {
  get eventName() { return "OfferCreated" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly offerId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly offeredCtc: number,
    public readonly designation: string,
    public readonly joiningDate: Date,
    public readonly performedById: string,
  ) { super(); }
}

export class OfferApprovedEvent extends DomainEvent {
  get eventName() { return "OfferApproved" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly offerId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly approverId: string,
    public readonly performedById: string,
  ) { super(); }
}

export class OfferReleasedEvent extends DomainEvent {
  get eventName() { return "OfferReleased" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly offerId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly performedById: string,
  ) { super(); }
}

export class OfferAcceptedEvent extends DomainEvent {
  get eventName() { return "OfferAccepted" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly offerId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly acceptedAt: Date,
    public readonly performedById: string,
  ) { super(); }
}

export class OfferDeclinedEvent extends DomainEvent {
  get eventName() { return "OfferDeclined" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly offerId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly reason: string | undefined,
    public readonly performedById: string,
  ) { super(); }
}

export class OfferRevokedEvent extends DomainEvent {
  get eventName() { return "OfferRevoked" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly offerId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly reason: string | undefined,
    public readonly performedById: string,
  ) { super(); }
}

// ── Joining Events ────────────────────────────────────────────────────────────

export class JoiningScheduledEvent extends DomainEvent {
  get eventName() { return "JoiningScheduled" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly joiningId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly joiningDate: Date,
    public readonly performedById: string,
  ) { super(); }
}

export class CandidateJoinedEvent extends DomainEvent {
  get eventName() { return "CandidateJoined" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly joiningId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly actualJoinedAt: Date,
    public readonly performedById: string,
  ) { super(); }
}

export class CandidateNoShowEvent extends DomainEvent {
  get eventName() { return "CandidateNoShow" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly joiningId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly performedById: string,
  ) { super(); }
}

export class JoiningFollowupCreatedEvent extends DomainEvent {
  get eventName() { return "JoiningFollowupCreated" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly followupId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly checkType: string,
    public readonly performedById: string,
  ) { super(); }
}
