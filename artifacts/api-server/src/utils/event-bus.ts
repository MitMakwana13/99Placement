import { EventEmitter } from "events";
import { prisma } from "@workspace/db-prisma";
import { logger } from "../config/logger";

export interface CandidateEventPayloads {
  CandidateCreated: {
    tenantId: string;
    candidateId: string;
    performedById?: string;
  };
  CandidateUpdated: {
    tenantId: string;
    candidateId: string;
    performedById?: string;
    changes: Record<string, any>;
  };
  CandidateDeleted: {
    tenantId: string;
    candidateId: string;
    performedById?: string;
  };
  CandidateRestored: {
    tenantId: string;
    candidateId: string;
    performedById?: string;
  };
  CandidateMerged: {
    tenantId: string;
    sourceCandidateId: string;
    targetCandidateId: string;
    performedById?: string;
  };
}

class EventBus extends EventEmitter {
  emitEvent<K extends keyof CandidateEventPayloads>(event: K, payload: CandidateEventPayloads[K]): void {
    logger.info({ event, payload }, `Publishing event: ${event}`);
    this.emit(event, payload);
  }
}

export const eventBus = new EventBus();

// Timeline & Audit logging event listeners
eventBus.on("CandidateCreated", async (payload) => {
  try {
    await prisma.$transaction([
      prisma.candidateTimeline.create({
        data: {
          tenantId: payload.tenantId,
          candidateId: payload.candidateId,
          eventType: "CandidateCreated",
          title: "Candidate Profile Created",
          description: "The initial candidate profile was created.",
          performedById: payload.performedById,
        },
      }),
      prisma.activityLog.create({
        data: {
          tenantId: payload.tenantId,
          entityType: "Candidate",
          entityId: payload.candidateId,
          action: "CREATE",
          performedById: payload.performedById,
          metadata: { message: "Candidate created" },
        },
      }),
    ]);
  } catch (err) {
    logger.error(err, "Error processing CandidateCreated event");
  }
});

eventBus.on("CandidateUpdated", async (payload) => {
  try {
    await prisma.$transaction([
      prisma.candidateTimeline.create({
        data: {
          tenantId: payload.tenantId,
          candidateId: payload.candidateId,
          eventType: "CandidateUpdated",
          title: "Candidate Profile Updated",
          description: `Updated fields: ${Object.keys(payload.changes).join(", ")}`,
          metadata: payload.changes || {},
          performedById: payload.performedById,
        },
      }),
      prisma.activityLog.create({
        data: {
          tenantId: payload.tenantId,
          entityType: "Candidate",
          entityId: payload.candidateId,
          action: "UPDATE",
          performedById: payload.performedById,
          metadata: { changes: payload.changes },
        },
      }),
    ]);
  } catch (err) {
    logger.error(err, "Error processing CandidateUpdated event");
  }
});

eventBus.on("CandidateDeleted", async (payload) => {
  try {
    await prisma.$transaction([
      prisma.candidateTimeline.create({
        data: {
          tenantId: payload.tenantId,
          candidateId: payload.candidateId,
          eventType: "CandidateDeleted",
          title: "Candidate Profile Soft Deleted",
          description: "The candidate profile was soft deleted.",
          performedById: payload.performedById,
        },
      }),
      prisma.activityLog.create({
        data: {
          tenantId: payload.tenantId,
          entityType: "Candidate",
          entityId: payload.candidateId,
          action: "DELETE",
          performedById: payload.performedById,
          metadata: { message: "Candidate soft deleted" },
        },
      }),
    ]);
  } catch (err) {
    logger.error(err, "Error processing CandidateDeleted event");
  }
});

eventBus.on("CandidateRestored", async (payload) => {
  try {
    await prisma.$transaction([
      prisma.candidateTimeline.create({
        data: {
          tenantId: payload.tenantId,
          candidateId: payload.candidateId,
          eventType: "CandidateRestored",
          title: "Candidate Profile Restored",
          description: "The soft-deleted candidate profile was restored.",
          performedById: payload.performedById,
        },
      }),
      prisma.activityLog.create({
        data: {
          tenantId: payload.tenantId,
          entityType: "Candidate",
          entityId: payload.candidateId,
          action: "RESTORE",
          performedById: payload.performedById,
          metadata: { message: "Candidate profile restored" },
        },
      }),
    ]);
  } catch (err) {
    logger.error(err, "Error processing CandidateRestored event");
  }
});

eventBus.on("CandidateMerged", async (payload) => {
  try {
    await prisma.$transaction([
      prisma.candidateTimeline.create({
        data: {
          tenantId: payload.tenantId,
          candidateId: payload.targetCandidateId,
          eventType: "CandidateMerged",
          title: "Duplicate Candidate Profile Merged",
          description: `Merged data from duplicate candidate profile (ID: ${payload.sourceCandidateId}) into this profile.`,
          metadata: { sourceCandidateId: payload.sourceCandidateId },
          performedById: payload.performedById,
        },
      }),
      prisma.activityLog.create({
        data: {
          tenantId: payload.tenantId,
          entityType: "Candidate",
          entityId: payload.targetCandidateId,
          action: "MERGE",
          performedById: payload.performedById,
          metadata: {
            sourceCandidateId: payload.sourceCandidateId,
            targetCandidateId: payload.targetCandidateId,
          },
        },
      }),
    ]);
  } catch (err) {
    logger.error(err, "Error processing CandidateMerged event");
  }
});
