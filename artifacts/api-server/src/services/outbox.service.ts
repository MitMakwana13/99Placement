import { prisma, OutboxEvent } from "@workspace/db-prisma";
import { queueProvider } from "../lib/queue/queue";
import { logger } from "../config/logger";
import { DomainEvent } from "../events/domain-event";

export class OutboxService {
  /**
   * Save domain event to outbox table.
   * If a transaction client (tx) is provided, it executes as part of the transaction.
   */
  static async saveEvent(
    tenantId: string,
    eventName: string,
    payload: any,
    tx?: any
  ): Promise<OutboxEvent> {
    const client = tx || prisma;
    
    // Serialize occurredAt and eventId if they are part of the event payload
    const serializedPayload = JSON.parse(JSON.stringify(payload));

    const event = await client.outboxEvent.create({
      data: {
        tenantId,
        eventName,
        payload: serializedPayload,
      },
    });

    logger.debug(`OutboxService: saved event [${eventName}] (ID: ${event.id})`);
    return event;
  }

  /**
   * Reads unprocessed outbox records, locking them with FOR UPDATE SKIP LOCKED,
   * dispatches them to the queue provider, and marks them processed.
   */
  static async publishPendingEvents(): Promise<number> {
    return await prisma.$transaction(async (tx) => {
      // Lock up to 50 unprocessed events using SKIP LOCKED to support horizontal scaling
      const lockedEvents: { id: string }[] = await tx.$queryRaw`
        SELECT id FROM "outbox_events"
        WHERE "processed_at" IS NULL
        ORDER BY "occurred_at" ASC
        LIMIT 50
        FOR UPDATE SKIP LOCKED
      `;

      if (lockedEvents.length === 0) {
        return 0;
      }

      const eventIds = lockedEvents.map((e) => e.id);

      const pending = await tx.outboxEvent.findMany({
        where: { id: { in: eventIds } },
        orderBy: { occurredAt: "asc" },
      });

      logger.debug(`OutboxService: processing ${pending.length} pending events under row lock`);

      let processedCount = 0;
      for (const event of pending) {
        try {
          // Enqueue the outbox event for async processing
          await queueProvider.addJob("outbox-events", event.eventName, {
            outboxEventId: event.id,
            tenantId: event.tenantId,
            eventName: event.eventName,
            payload: event.payload,
          });

          // Mark as processed in database
          await tx.outboxEvent.update({
            where: { id: event.id },
            data: { processedAt: new Date() },
          });

          processedCount++;
        } catch (err: any) {
          logger.error(`OutboxService: failed to process event [${event.id}]: ${err.message}`);
          await tx.outboxEvent.update({
            where: { id: event.id },
            data: {
              attempts: { increment: 1 },
              lastError: err.message,
            },
          });
        }
      }

      return processedCount;
    });
  }

  /**
   * Start a background polling agent for outbox events
   */
  static startWorker(intervalMs = 5000): NodeJS.Timeout {
    logger.info(`Outbox worker started with interval ${intervalMs}ms`);
    return setInterval(async () => {
      try {
        await this.publishPendingEvents();
      } catch (err: any) {
        logger.error(`Outbox worker polling error: ${err.message}`);
      }
    }, intervalMs);
  }
}
