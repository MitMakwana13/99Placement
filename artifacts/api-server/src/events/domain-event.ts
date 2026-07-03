/**
 * Base class for all domain events.
 *
 * Design rationale:
 *  - Every event carries a unique `eventId` (for idempotency & tracing).
 *  - `occurredAt` timestamps are set at construction so handlers see the
 *    real time the event was raised, not when they executed.
 *  - The abstract `eventName` getter ensures every concrete event is
 *    self-describing (no stringly-typed switch statements needed).
 *  - BullMQ compatibility: when we migrate, we serialize the whole class
 *    instance to JSON and pass it as the job payload — everything needed
 *    travels with the event.
 */

import { randomUUID } from "crypto";

export abstract class DomainEvent {
  /** Unique identifier for this specific event occurrence. */
  readonly eventId: string;

  /** ISO timestamp of when the event was raised. */
  readonly occurredAt: Date;

  constructor() {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
  }

  /**
   * Human-readable name used for routing to handlers.
   * Must be unique across all domain events.
   */
  abstract get eventName(): string;
}

/**
 * Contract every event handler must satisfy.
 *
 * Returning Promise<void> (not void) is intentional:
 *  - The bus awaits all handlers, making side-effects deterministic.
 *  - No more fire-and-forget; failures surface immediately.
 *  - Enables per-handler retry wrappers without touching the bus itself.
 */
export interface IEventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
}
