/**
 * Internal Screening Domain Events
 *
 * These events represent the 99 Placement internal screening workflow:
 * Scheduled → Conducted → Scored → Verdict issued
 */

import { DomainEvent } from "../domain-event";

// ── ScreeningScheduled ────────────────────────────────────────────────────────

export class ScreeningScheduledEvent extends DomainEvent {
  get eventName() { return "ScreeningScheduled" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly screeningId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly interviewerId: string,
    public readonly scheduledAt: Date,
    public readonly mode: string,
    public readonly performedById: string,
  ) { super(); }
}

// ── ScreeningConducted ────────────────────────────────────────────────────────

export class ScreeningConductedEvent extends DomainEvent {
  get eventName() { return "ScreeningConducted" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly screeningId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly overallScore: number,
    public readonly verdict: string,
    public readonly performedById: string,
  ) { super(); }
}

// ── ScreeningShortlisted ──────────────────────────────────────────────────────

export class ScreeningShortlistedEvent extends DomainEvent {
  get eventName() { return "ScreeningShortlisted" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly screeningId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly overallScore: number,
    public readonly performedById: string,
  ) { super(); }
}

// ── ScreeningRejected ─────────────────────────────────────────────────────────

export class ScreeningRejectedEvent extends DomainEvent {
  get eventName() { return "ScreeningRejected" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly screeningId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly reason: string | undefined,
    public readonly performedById: string,
  ) { super(); }
}

// ── ScreeningRescheduled ──────────────────────────────────────────────────────

export class ScreeningRescheduledEvent extends DomainEvent {
  get eventName() { return "ScreeningRescheduled" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly screeningId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly oldScheduledAt: Date | null,
    public readonly newScheduledAt: Date,
    public readonly performedById: string,
  ) { super(); }
}

// ── ScreeningCancelled ────────────────────────────────────────────────────────

export class ScreeningCancelledEvent extends DomainEvent {
  get eventName() { return "ScreeningCancelled" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly screeningId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly reason: string | undefined,
    public readonly performedById: string,
  ) { super(); }
}
