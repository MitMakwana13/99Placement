/**
 * Company Event Handlers
 *
 * Pattern: one class per concern per event (Timeline vs Audit vs Notification).
 * All handlers implement IEventHandler<T> and return Promise<void>.
 * The bus awaits all handlers via Promise.allSettled().
 */

import { prisma } from "@workspace/db-prisma";
import { IEventHandler } from "../domain-event";
import {
  CompanyCreatedEvent,
  CompanyUpdatedEvent,
  CompanyArchivedEvent,
  CompanyRestoredEvent,
  CompanyMergedEvent,
  RecruiterAssignedEvent,
  ContactCreatedEvent,
} from "./company.events";
import { logger } from "../../config/logger";

// ---------------------------------------------------------------------------
// CompanyCreated
// ---------------------------------------------------------------------------
export class CompanyCreatedTimelineHandler implements IEventHandler<CompanyCreatedEvent> {
  async handle(event: CompanyCreatedEvent): Promise<void> {
    await prisma.companyTimeline.create({
      data: {
        tenantId: event.tenantId,
        companyId: event.companyId,
        eventType: "CompanyCreated",
        title: "Company Profile Created",
        description: "The initial company profile was created.",
        performedById: event.performedById,
      },
    });
    logger.debug({ companyId: event.companyId }, "Timeline: CompanyCreated recorded");
  }
}

export class CompanyCreatedAuditHandler implements IEventHandler<CompanyCreatedEvent> {
  async handle(event: CompanyCreatedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "Company",
        entityId: event.companyId,
        action: "CREATE",
        performedById: event.performedById,
        metadata: { message: "Company created", eventId: event.eventId },
      },
    });
    logger.debug({ companyId: event.companyId }, "AuditLog: CompanyCreated recorded");
  }
}

// ---------------------------------------------------------------------------
// CompanyUpdated
// ---------------------------------------------------------------------------
export class CompanyUpdatedTimelineHandler implements IEventHandler<CompanyUpdatedEvent> {
  async handle(event: CompanyUpdatedEvent): Promise<void> {
    await prisma.companyTimeline.create({
      data: {
        tenantId: event.tenantId,
        companyId: event.companyId,
        eventType: "CompanyUpdated",
        title: "Company Profile Updated",
        description: `Updated fields: ${Object.keys(event.changes).join(", ")}`,
        metadata: event.changes as any,
        performedById: event.performedById,
      },
    });
    logger.debug({ companyId: event.companyId }, "Timeline: CompanyUpdated recorded");
  }
}

export class CompanyUpdatedAuditHandler implements IEventHandler<CompanyUpdatedEvent> {
  async handle(event: CompanyUpdatedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "Company",
        entityId: event.companyId,
        action: "UPDATE",
        performedById: event.performedById,
        metadata: { changes: event.changes as any, eventId: event.eventId },
      },
    });
    logger.debug({ companyId: event.companyId }, "AuditLog: CompanyUpdated recorded");
  }
}

// ---------------------------------------------------------------------------
// CompanyArchived
// ---------------------------------------------------------------------------
export class CompanyArchivedTimelineHandler implements IEventHandler<CompanyArchivedEvent> {
  async handle(event: CompanyArchivedEvent): Promise<void> {
    await prisma.companyTimeline.create({
      data: {
        tenantId: event.tenantId,
        companyId: event.companyId,
        eventType: "CompanyArchived",
        title: "Company Archived",
        description: "The company profile was archived.",
        performedById: event.performedById,
      },
    });
    logger.debug({ companyId: event.companyId }, "Timeline: CompanyArchived recorded");
  }
}

export class CompanyArchivedAuditHandler implements IEventHandler<CompanyArchivedEvent> {
  async handle(event: CompanyArchivedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "Company",
        entityId: event.companyId,
        action: "ARCHIVE",
        performedById: event.performedById,
        metadata: { message: "Company archived", eventId: event.eventId },
      },
    });
    logger.debug({ companyId: event.companyId }, "AuditLog: CompanyArchived recorded");
  }
}

// ---------------------------------------------------------------------------
// CompanyRestored
// ---------------------------------------------------------------------------
export class CompanyRestoredTimelineHandler implements IEventHandler<CompanyRestoredEvent> {
  async handle(event: CompanyRestoredEvent): Promise<void> {
    await prisma.companyTimeline.create({
      data: {
        tenantId: event.tenantId,
        companyId: event.companyId,
        eventType: "CompanyRestored",
        title: "Company Restored",
        description: "The archived company profile was restored.",
        performedById: event.performedById,
      },
    });
    logger.debug({ companyId: event.companyId }, "Timeline: CompanyRestored recorded");
  }
}

export class CompanyRestoredAuditHandler implements IEventHandler<CompanyRestoredEvent> {
  async handle(event: CompanyRestoredEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "Company",
        entityId: event.companyId,
        action: "RESTORE",
        performedById: event.performedById,
        metadata: { message: "Company profile restored", eventId: event.eventId },
      },
    });
    logger.debug({ companyId: event.companyId }, "AuditLog: CompanyRestored recorded");
  }
}

// ---------------------------------------------------------------------------
// CompanyMerged
// ---------------------------------------------------------------------------
export class CompanyMergedTimelineHandler implements IEventHandler<CompanyMergedEvent> {
  async handle(event: CompanyMergedEvent): Promise<void> {
    await prisma.companyTimeline.create({
      data: {
        tenantId: event.tenantId,
        companyId: event.targetCompanyId,
        eventType: "CompanyMerged",
        title: "Duplicate Company Profile Merged",
        description: `Merged data from duplicate company profile (ID: ${event.sourceCompanyId}) into this profile.`,
        metadata: { sourceCompanyId: event.sourceCompanyId },
        performedById: event.performedById,
      },
    });
    logger.debug({ targetCompanyId: event.targetCompanyId }, "Timeline: CompanyMerged recorded");
  }
}

export class CompanyMergedAuditHandler implements IEventHandler<CompanyMergedEvent> {
  async handle(event: CompanyMergedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "Company",
        entityId: event.targetCompanyId,
        action: "MERGE",
        performedById: event.performedById,
        metadata: {
          sourceCompanyId: event.sourceCompanyId,
          targetCompanyId: event.targetCompanyId,
          eventId: event.eventId,
        },
      },
    });
    logger.debug({ targetCompanyId: event.targetCompanyId }, "AuditLog: CompanyMerged recorded");
  }
}

// ---------------------------------------------------------------------------
// RecruiterAssigned
// ---------------------------------------------------------------------------
export class RecruiterAssignedTimelineHandler implements IEventHandler<RecruiterAssignedEvent> {
  async handle(event: RecruiterAssignedEvent): Promise<void> {
    await prisma.companyTimeline.create({
      data: {
        tenantId: event.tenantId,
        companyId: event.companyId,
        eventType: "RecruiterAssigned",
        title: "Recruiter Assigned",
        description: `Recruiter (User ID: ${event.userId}) assigned to company.${event.isLead ? " Assigned as Lead Recruiter." : ""}`,
        metadata: { userId: event.userId, isLead: event.isLead },
        performedById: event.performedById,
      },
    });
    logger.debug({ companyId: event.companyId, userId: event.userId }, "Timeline: RecruiterAssigned recorded");
  }
}

export class RecruiterAssignedAuditHandler implements IEventHandler<RecruiterAssignedEvent> {
  async handle(event: RecruiterAssignedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "Company",
        entityId: event.companyId,
        action: "ASSIGN_RECRUITER",
        performedById: event.performedById,
        metadata: { userId: event.userId, isLead: event.isLead, eventId: event.eventId },
      },
    });
    logger.debug({ companyId: event.companyId }, "AuditLog: RecruiterAssigned recorded");
  }
}

// ---------------------------------------------------------------------------
// ContactCreated
// ---------------------------------------------------------------------------
export class ContactCreatedTimelineHandler implements IEventHandler<ContactCreatedEvent> {
  async handle(event: ContactCreatedEvent): Promise<void> {
    await prisma.companyTimeline.create({
      data: {
        tenantId: event.tenantId,
        companyId: event.companyId,
        eventType: "ContactCreated",
        title: "Company Contact Added",
        description: `New contact (ID: ${event.contactId}) was added to the company.`,
        metadata: { contactId: event.contactId },
        performedById: event.performedById,
      },
    });
    logger.debug({ companyId: event.companyId, contactId: event.contactId }, "Timeline: ContactCreated recorded");
  }
}

export class ContactCreatedAuditHandler implements IEventHandler<ContactCreatedEvent> {
  async handle(event: ContactCreatedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "Company",
        entityId: event.companyId,
        action: "ADD_CONTACT",
        performedById: event.performedById,
        metadata: { contactId: event.contactId, eventId: event.eventId },
      },
    });
    logger.debug({ companyId: event.companyId }, "AuditLog: ContactCreated recorded");
  }
}
