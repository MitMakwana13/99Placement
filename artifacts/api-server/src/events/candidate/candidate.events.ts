/**
 * Candidate Domain Events
 *
 * Each event is a plain data-carrier extending DomainEvent.
 * They are intentionally anemic (no behaviour) — they describe
 * what happened, not what to do about it.
 *
 * Naming convention: <Aggregate><PastTenseVerb>Event
 *
 * BullMQ note: When queueing, the entire class instance is
 * JSON-serialized. Keep all properties JSON-safe (no circular refs,
 * no class instances as property values).
 */

import { DomainEvent } from "../domain-event";

// ---------------------------------------------------------------------------
// CandidateCreatedEvent
// ---------------------------------------------------------------------------
export class CandidateCreatedEvent extends DomainEvent {
  get eventName() {
    return "CandidateCreated" as const;
  }

  constructor(
    public readonly tenantId: string,
    public readonly candidateId: string,
    public readonly performedById?: string
  ) {
    super();
  }
}

// ---------------------------------------------------------------------------
// CandidateUpdatedEvent
// ---------------------------------------------------------------------------
export class CandidateUpdatedEvent extends DomainEvent {
  get eventName() {
    return "CandidateUpdated" as const;
  }

  constructor(
    public readonly tenantId: string,
    public readonly candidateId: string,
    public readonly changes: Record<string, { old: unknown; new: unknown }>,
    public readonly performedById?: string
  ) {
    super();
  }
}

// ---------------------------------------------------------------------------
// CandidateDeletedEvent
// ---------------------------------------------------------------------------
export class CandidateDeletedEvent extends DomainEvent {
  get eventName() {
    return "CandidateDeleted" as const;
  }

  constructor(
    public readonly tenantId: string,
    public readonly candidateId: string,
    public readonly performedById?: string
  ) {
    super();
  }
}

// ---------------------------------------------------------------------------
// CandidateRestoredEvent
// ---------------------------------------------------------------------------
export class CandidateRestoredEvent extends DomainEvent {
  get eventName() {
    return "CandidateRestored" as const;
  }

  constructor(
    public readonly tenantId: string,
    public readonly candidateId: string,
    public readonly performedById?: string
  ) {
    super();
  }
}

// ---------------------------------------------------------------------------
// CandidateMergedEvent
// ---------------------------------------------------------------------------
export class CandidateMergedEvent extends DomainEvent {
  get eventName() {
    return "CandidateMerged" as const;
  }

  constructor(
    public readonly tenantId: string,
    public readonly sourceCandidateId: string,
    public readonly targetCandidateId: string,
    public readonly performedById?: string
  ) {
    super();
  }
}
