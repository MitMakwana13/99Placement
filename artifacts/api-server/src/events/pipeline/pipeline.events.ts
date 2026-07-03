import { DomainEvent } from "../domain-event";
import { PipelineStage } from "@prisma/client";

// ─── Candidate Added To Pipeline ─────────────────────────────────────────────
export class CandidateAddedToPipelineEvent extends DomainEvent {
  get eventName() { return "CandidateAddedToPipeline" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly jobId: string,
    public readonly stage: PipelineStage,
    public readonly performedById: string,
  ) {
    super();
  }
}

// ─── Pipeline Stage Changed ──────────────────────────────────────────────────
export class PipelineStageChangedEvent extends DomainEvent {
  get eventName() { return "PipelineStageChanged" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly jobId: string,
    public readonly oldStage: PipelineStage | null,
    public readonly newStage: PipelineStage,
    public readonly reason: string | undefined,
    public readonly performedById: string,
  ) {
    super();
  }
}

// ─── Candidate Rejected ──────────────────────────────────────────────────────
export class CandidateRejectedEvent extends DomainEvent {
  get eventName() { return "CandidateRejected" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly jobId: string,
    public readonly stage: PipelineStage,
    public readonly reason: string | undefined,
    public readonly performedById: string,
  ) {
    super();
  }
}

// ─── Candidate Withdrawn ─────────────────────────────────────────────────────
export class CandidateWithdrawnEvent extends DomainEvent {
  get eventName() { return "CandidateWithdrawn" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly jobId: string,
    public readonly reason: string | undefined,
    public readonly performedById: string,
  ) {
    super();
  }
}

// ─── Candidate Shortlisted ───────────────────────────────────────────────────
export class CandidateShortlistedEvent extends DomainEvent {
  get eventName() { return "CandidateShortlisted" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly jobId: string,
    public readonly performedById: string,
  ) {
    super();
  }
}

// ─── Candidate Hired ─────────────────────────────────────────────────────────
export class CandidateHiredEvent extends DomainEvent {
  get eventName() { return "CandidateHired" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly jobId: string,
    public readonly performedById: string,
  ) {
    super();
  }
}

// ─── Reminder Created ────────────────────────────────────────────────────────
export class ReminderCreatedEvent extends DomainEvent {
  get eventName() { return "ReminderCreated" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly pipelineId: string,
    public readonly reminderId: string,
    public readonly userId: string,
    public readonly reminderType: string,
    public readonly remindAt: Date,
    public readonly performedById: string,
  ) {
    super();
  }
}

// ─── Rating Updated ──────────────────────────────────────────────────────────
export class RatingUpdatedEvent extends DomainEvent {
  get eventName() { return "RatingUpdated" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly pipelineId: string,
    public readonly ratingId: string,
    public readonly ratedById: string,
    public readonly recruiterRating: number | null,
    public readonly technicalRating: number | null,
    public readonly hrRating: number | null,
    public readonly overallRating: number | null,
    public readonly performedById: string,
  ) {
    super();
  }
}
