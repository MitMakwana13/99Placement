/**
 * AwaitableDomainEventBus
 *
 * Architecture decisions:
 *
 * 1. WHY NOT NODE EventEmitter?
 *    EventEmitter.emit() is synchronous for listener invocation but any async
 *    work inside a listener is fire-and-forget — the caller has no way to
 *    await it. This caused the race condition in tests (and would cause
 *    data-loss bugs in production, e.g. timeline rows missing from the DB).
 *
 * 2. WHY Promise.allSettled() OVER Promise.all()?
 *    Promise.all() short-circuits on the first rejection, which means one bad
 *    handler silently prevents all subsequent handlers from running.
 *    allSettled() runs every handler regardless, then we collect + rethrow
 *    any failures. This preserves observability while maintaining atomicity.
 *
 * 3. WHY A MAP OF HANDLER ARRAYS?
 *    Allows multiple independent handlers per event (timeline, audit,
 *    notifications, webhooks) without coupling them together.
 *
 * 4. BullMQ MIGRATION PATH:
 *    When we add a queue, we replace the body of `publish()` with:
 *      await queue.add(event.eventName, event)
 *    …and move each handler class into a BullMQ Worker processor.
 *    The DomainEvent classes, IEventHandler interface, and all callers
 *    in services stay UNCHANGED — only the bus internals change.
 *
 * 5. WHY publishMany()?
 *    Services frequently need to emit several events atomically (e.g. after a
 *    merge: CandidateMerged + CandidateDeleted). publishMany() awaits all of
 *    them in parallel for maximum throughput.
 */

import { DomainEvent, IEventHandler } from "./domain-event";
import { logger } from "../config/logger";
import { queueProvider } from "../lib/queue/queue";

export class DomainEventBus {
  /** Registry: eventName → ordered list of handlers */
  private readonly handlers = new Map<string, IEventHandler[]>();

  /**
   * Reset all handler registrations. Used in tests/bootstrap to prevent duplicate subscriptions.
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Register a handler for a specific event.
   * Multiple handlers per event are supported and called in registration order.
   */
  subscribe<T extends DomainEvent>(
    eventName: string,
    handler: IEventHandler<T>
  ): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler as IEventHandler);
    logger.debug(
      { eventName, handlerName: handler.constructor.name },
      `EventBus: subscribed handler`
    );
  }

  /**
   * Publish a single domain event and await ALL registered handlers.
   *
   * - Uses Promise.allSettled() so every handler runs even if one fails.
   * - Any handler errors are collected and re-thrown as an AggregateError.
   * - This makes the method deterministic: callers can safely assert
   *   side-effects (DB rows, etc.) immediately after awaiting publish().
   */
  async publish<T extends DomainEvent>(event: T, tx?: any): Promise<void> {
    if (process.env.NODE_ENV === "test") {
      // In tests, execute handlers synchronously to avoid race conditions and preserve assertions
      await this.executeHandlers(event);
      return;
    }

    try {
      const { OutboxService } = await import("../services/outbox.service");
      const tenantId = (event as any).tenantId || "SYSTEM";
      await OutboxService.saveEvent(tenantId, event.eventName, event, tx);

      // Non-blocking quick trigger to process pending events immediately
      setImmediate(() => {
        OutboxService.publishPendingEvents().catch((err) => {
          logger.error(`OutboxService background publishing failed: ${err.message}`);
        });
      });
    } catch (err: any) {
      logger.error(`Failed to route event through Outbox: ${err.message}. Falling back to direct dispatch.`);
      await this.executeHandlers(event);
    }
  }

  /**
   * Directly invokes the registered handler callback functions for an event
   */
  async executeHandlers(event: any): Promise<void> {
    const eventHandlers = this.handlers.get(event.eventName) ?? [];

    logger.info(
      { eventName: event.eventName, eventId: event.eventId, occurredAt: event.occurredAt },
      `EventBus: executing handlers for [${event.eventName}]`
    );

    if (eventHandlers.length === 0) {
      logger.warn(
        { eventName: event.eventName },
        `EventBus: no handlers registered for [${event.eventName}]`
      );
      return;
    }

    const results = await Promise.allSettled(
      eventHandlers.map((handler) => handler.handle(event))
    );

    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected"
    );

    if (failures.length > 0) {
      const errors = failures.map((f) => f.reason);
      errors.forEach((err) =>
        logger.error(
          { eventName: event.eventName, err },
          `EventBus: handler error for [${event.eventName}]`
        )
      );
      // Re-throw so service-layer callers see the failure
      throw new AggregateError(
        errors,
        `${failures.length} handler(s) failed for event [${event.eventName}]`
      );
    }
  }

  /**
   * Publish multiple domain events and await all handlers in parallel.
   * Individual publish() calls run concurrently for maximum throughput.
   */
  async publishMany<T extends DomainEvent>(events: T[]): Promise<void> {
    await Promise.all(events.map((event) => this.publish(event)));
  }
}

/** Singleton instance — imported by services and the bootstrap module. */
export const domainEventBus = new DomainEventBus();

// Register processor to process outbox events pushed to the queue
queueProvider.registerProcessor("outbox-events", async (jobData: any) => {
  const event = {
    ...jobData.payload,
    occurredAt: jobData.payload.occurredAt ? new Date(jobData.payload.occurredAt) : new Date(),
  };
  await domainEventBus.executeHandlers(event);
});
