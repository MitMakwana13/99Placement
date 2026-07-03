/**
 * Assessment Domain Events
 */

import { DomainEvent } from "../domain-event";

// ── AssessmentAssignedEvent ──────────────────────────────────────────────────
export class AssessmentAssignedEvent extends DomainEvent {
  get eventName() { return "AssessmentAssigned" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly testId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly attemptNumber: number,
    public readonly performedById: string,
  ) { super(); }
}

// ── AssessmentStartedEvent ───────────────────────────────────────────────────
export class AssessmentStartedEvent extends DomainEvent {
  get eventName() { return "AssessmentStarted" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly testId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly startedAt: Date,
    public readonly performedById: string,
  ) { super(); }
}

// ── AssessmentSubmittedEvent ──────────────────────────────────────────────────
export class AssessmentSubmittedEvent extends DomainEvent {
  get eventName() { return "AssessmentSubmitted" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly testId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly submittedAt: Date,
    public readonly performedById: string,
  ) { super(); }
}

// ── AssessmentEvaluatedEvent ──────────────────────────────────────────────────
export class AssessmentEvaluatedEvent extends DomainEvent {
  get eventName() { return "AssessmentEvaluated" as const; }

  constructor(
    public readonly tenantId: string,
    public readonly testId: string,
    public readonly pipelineId: string,
    public readonly candidateId: string,
    public readonly score: number,
    public readonly maxScore: number,
    public readonly percentage: number,
    public readonly verdict: string, // PASS | FAIL
    public readonly performedById: string,
  ) { super(); }
}
