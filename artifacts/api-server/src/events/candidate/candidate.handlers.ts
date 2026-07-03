/**
 * Candidate Event Handlers
 *
 * Design decisions:
 *
 * 1. ONE CLASS PER RESPONSIBILITY
 *    Each handler has a single job. This makes them independently testable,
 *    replaceable, and easy to move into separate BullMQ Workers later.
 *
 * 2. HANDLERS ARE AWAITED BY THE BUS
 *    The bus uses Promise.allSettled(), so a failure in TimelineHandler will
 *    not prevent AuditLogHandler from running, but both failures are surfaced.
 *
 * 3. NO CROSS-HANDLER DEPENDENCIES
 *    Handlers must never call each other. If handler B needs data that
 *    handler A produces, both should read from the DB or the event payload.
 *
 * 4. PRISMA INSIDE HANDLERS (NOT TRANSACTIONS)
 *    Timeline/audit writes are intentionally outside the originating DB
 *    transaction. They are "eventual" in the domain sense — if the core
 *    operation succeeded, we want the timeline record even if it requires
 *    a retry. Keeping them separate also avoids inflating transaction scope.
 *
 * 5. BULLMQ MIGRATION PATH
 *    Replace the class body's `handle()` with a Worker processor function.
 *    The class skeleton and IEventHandler interface stay identical.
 */

import { prisma } from "@workspace/db-prisma";
import { IEventHandler } from "../domain-event";
import {
  CandidateCreatedEvent,
  CandidateUpdatedEvent,
  CandidateDeletedEvent,
  CandidateRestoredEvent,
  CandidateMergedEvent,
} from "./candidate.events";
import { logger } from "../../config/logger";

// ---------------------------------------------------------------------------
// CandidateCreated handlers
// ---------------------------------------------------------------------------

export class CandidateCreatedTimelineHandler
  implements IEventHandler<CandidateCreatedEvent>
{
  async handle(event: CandidateCreatedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: "CandidateCreated",
        title: "Candidate Profile Created",
        description: "The initial candidate profile was created.",
        performedById: event.performedById,
      },
    });
    logger.debug({ candidateId: event.candidateId }, "Timeline: CandidateCreated recorded");
  }
}

export class CandidateCreatedAuditHandler
  implements IEventHandler<CandidateCreatedEvent>
{
  async handle(event: CandidateCreatedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "Candidate",
        entityId: event.candidateId,
        action: "CREATE",
        performedById: event.performedById,
        metadata: { message: "Candidate created", eventId: event.eventId },
      },
    });
    logger.debug({ candidateId: event.candidateId }, "AuditLog: CandidateCreated recorded");
  }
}

// ---------------------------------------------------------------------------
// CandidateUpdated handlers
// ---------------------------------------------------------------------------

export class CandidateUpdatedTimelineHandler
  implements IEventHandler<CandidateUpdatedEvent>
{
  async handle(event: CandidateUpdatedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: "CandidateUpdated",
        title: "Candidate Profile Updated",
        description: `Updated fields: ${Object.keys(event.changes).join(", ")}`,
        metadata: event.changes as any,
        performedById: event.performedById,
      },
    });
    logger.debug({ candidateId: event.candidateId }, "Timeline: CandidateUpdated recorded");
  }
}

export class CandidateUpdatedAuditHandler
  implements IEventHandler<CandidateUpdatedEvent>
{
  async handle(event: CandidateUpdatedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "Candidate",
        entityId: event.candidateId,
        action: "UPDATE",
        performedById: event.performedById,
        metadata: { changes: event.changes as any, eventId: event.eventId },
      },
    });
    logger.debug({ candidateId: event.candidateId }, "AuditLog: CandidateUpdated recorded");
  }
}

// ---------------------------------------------------------------------------
// CandidateDeleted handlers
// ---------------------------------------------------------------------------

export class CandidateDeletedTimelineHandler
  implements IEventHandler<CandidateDeletedEvent>
{
  async handle(event: CandidateDeletedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: "CandidateDeleted",
        title: "Candidate Profile Soft Deleted",
        description: "The candidate profile was soft deleted.",
        performedById: event.performedById,
      },
    });
    logger.debug({ candidateId: event.candidateId }, "Timeline: CandidateDeleted recorded");
  }
}

export class CandidateDeletedAuditHandler
  implements IEventHandler<CandidateDeletedEvent>
{
  async handle(event: CandidateDeletedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "Candidate",
        entityId: event.candidateId,
        action: "DELETE",
        performedById: event.performedById,
        metadata: { message: "Candidate soft deleted", eventId: event.eventId },
      },
    });
    logger.debug({ candidateId: event.candidateId }, "AuditLog: CandidateDeleted recorded");
  }
}

// ---------------------------------------------------------------------------
// CandidateRestored handlers
// ---------------------------------------------------------------------------

export class CandidateRestoredTimelineHandler
  implements IEventHandler<CandidateRestoredEvent>
{
  async handle(event: CandidateRestoredEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: "CandidateRestored",
        title: "Candidate Profile Restored",
        description: "The soft-deleted candidate profile was restored.",
        performedById: event.performedById,
      },
    });
    logger.debug({ candidateId: event.candidateId }, "Timeline: CandidateRestored recorded");
  }
}

export class CandidateRestoredAuditHandler
  implements IEventHandler<CandidateRestoredEvent>
{
  async handle(event: CandidateRestoredEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "Candidate",
        entityId: event.candidateId,
        action: "RESTORE",
        performedById: event.performedById,
        metadata: { message: "Candidate profile restored", eventId: event.eventId },
      },
    });
    logger.debug({ candidateId: event.candidateId }, "AuditLog: CandidateRestored recorded");
  }
}

// ---------------------------------------------------------------------------
// CandidateMerged handlers
// ---------------------------------------------------------------------------

export class CandidateMergedTimelineHandler
  implements IEventHandler<CandidateMergedEvent>
{
  async handle(event: CandidateMergedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.targetCandidateId,
        eventType: "CandidateMerged",
        title: "Duplicate Candidate Profile Merged",
        description: `Merged data from duplicate profile (ID: ${event.sourceCandidateId}) into this profile.`,
        metadata: { sourceCandidateId: event.sourceCandidateId },
        performedById: event.performedById,
      },
    });
    logger.debug(
      { targetCandidateId: event.targetCandidateId, sourceCandidateId: event.sourceCandidateId },
      "Timeline: CandidateMerged recorded"
    );
  }
}

export class CandidateMergedAuditHandler
  implements IEventHandler<CandidateMergedEvent>
{
  async handle(event: CandidateMergedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "Candidate",
        entityId: event.targetCandidateId,
        action: "MERGE",
        performedById: event.performedById,
        metadata: {
          sourceCandidateId: event.sourceCandidateId,
          targetCandidateId: event.targetCandidateId,
          eventId: event.eventId,
        },
      },
    });
    logger.debug(
      { targetCandidateId: event.targetCandidateId },
      "AuditLog: CandidateMerged recorded"
    );
  }
}
