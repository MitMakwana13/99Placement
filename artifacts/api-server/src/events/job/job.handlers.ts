import { prisma } from "@workspace/db-prisma";
import { IEventHandler } from "../domain-event";
import {
  JobCreatedEvent,
  JobUpdatedEvent,
  JobClosedEvent,
  JobOpenedEvent,
  JobArchivedEvent,
  JobRestoredEvent,
  JobAssignedEvent,
  JobApprovedEvent,
  JobClonedEvent,
} from "./job.events";

// ─────────────────────────────────────────────────────────────────────────────
// JobCreated Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class JobCreatedTimelineHandler implements IEventHandler<JobCreatedEvent> {
  async handle(event: JobCreatedEvent): Promise<void> {
    await prisma.jobTimeline.create({
      data: {
        tenantId:     event.tenantId,
        jobId:        event.jobId,
        eventType:    event.eventName,
        title:        "Job Posted",
        description:  `Job "${event.title}" was created for company.`,
        performedById: event.performedById,
        metadata:     { title: event.title, companyId: event.companyId },
      },
    });
  }
}

export class JobCreatedAuditHandler implements IEventHandler<JobCreatedEvent> {
  async handle(event: JobCreatedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId:     event.tenantId,
        entityType:   "JOB",
        entityId:     event.jobId,
        action:       "CREATE",
        performedById: event.performedById,
        metadata:     { title: event.title, companyId: event.companyId },
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JobUpdated Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class JobUpdatedTimelineHandler implements IEventHandler<JobUpdatedEvent> {
  async handle(event: JobUpdatedEvent): Promise<void> {
    const fieldsSummary = Object.keys(event.changes).join(", ");
    await prisma.jobTimeline.create({
      data: {
        tenantId:     event.tenantId,
        jobId:        event.jobId,
        eventType:    event.eventName,
        title:        "Job Updated",
        description:  `Fields changed: ${fieldsSummary}`,
        performedById: event.performedById,
        metadata:     event.changes as object,
      },
    });
  }
}

export class JobUpdatedAuditHandler implements IEventHandler<JobUpdatedEvent> {
  async handle(event: JobUpdatedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId:     event.tenantId,
        entityType:   "JOB",
        entityId:     event.jobId,
        action:       "UPDATE",
        performedById: event.performedById,
        metadata:     event.changes as object,
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JobClosed Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class JobClosedTimelineHandler implements IEventHandler<JobClosedEvent> {
  async handle(event: JobClosedEvent): Promise<void> {
    await prisma.jobTimeline.create({
      data: {
        tenantId:     event.tenantId,
        jobId:        event.jobId,
        eventType:    event.eventName,
        title:        "Job Closed",
        description:  event.reason ?? "Job was marked as closed.",
        performedById: event.performedById,
        metadata:     { reason: event.reason },
      },
    });
  }
}

export class JobClosedAuditHandler implements IEventHandler<JobClosedEvent> {
  async handle(event: JobClosedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId:     event.tenantId,
        entityType:   "JOB",
        entityId:     event.jobId,
        action:       "CLOSE",
        performedById: event.performedById,
        metadata:     { reason: event.reason },
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JobOpened Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class JobOpenedTimelineHandler implements IEventHandler<JobOpenedEvent> {
  async handle(event: JobOpenedEvent): Promise<void> {
    await prisma.jobTimeline.create({
      data: {
        tenantId:     event.tenantId,
        jobId:        event.jobId,
        eventType:    event.eventName,
        title:        "Job Reopened",
        description:  "Job was reopened and set to OPEN status.",
        performedById: event.performedById,
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JobArchived / Restored Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class JobArchivedTimelineHandler implements IEventHandler<JobArchivedEvent> {
  async handle(event: JobArchivedEvent): Promise<void> {
    await prisma.jobTimeline.create({
      data: {
        tenantId:     event.tenantId,
        jobId:        event.jobId,
        eventType:    event.eventName,
        title:        "Job Archived",
        description:  "Job was moved to the archive.",
        performedById: event.performedById,
      },
    });
  }
}

export class JobRestoredTimelineHandler implements IEventHandler<JobRestoredEvent> {
  async handle(event: JobRestoredEvent): Promise<void> {
    await prisma.jobTimeline.create({
      data: {
        tenantId:     event.tenantId,
        jobId:        event.jobId,
        eventType:    event.eventName,
        title:        "Job Restored from Archive",
        description:  "Job was restored and set back to OPEN.",
        performedById: event.performedById,
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JobAssigned Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class JobAssignedTimelineHandler implements IEventHandler<JobAssignedEvent> {
  async handle(event: JobAssignedEvent): Promise<void> {
    await prisma.jobTimeline.create({
      data: {
        tenantId:     event.tenantId,
        jobId:        event.jobId,
        eventType:    event.eventName,
        title:        `${event.assigneeType === "HIRING_MANAGER" ? "Hiring Manager" : "Recruiter"} Assigned`,
        description:  `${event.assigneeType} assigned${event.isLead ? " as lead" : ""}.`,
        performedById: event.performedById,
        metadata:     {
          assigneeId:   event.assigneeId,
          assigneeType: event.assigneeType,
          isLead:       event.isLead,
        },
      },
    });
  }
}

export class JobAssignedNotificationHandler implements IEventHandler<JobAssignedEvent> {
  async handle(event: JobAssignedEvent): Promise<void> {
    const label = event.assigneeType === "HIRING_MANAGER" ? "Hiring Manager" : "Recruiter";
    await prisma.notification.create({
      data: {
        tenantId:    event.tenantId,
        recipientId: event.assigneeId,
        type:        "JOB_ASSIGNED",
        title:       `You have been assigned as ${label}`,
        body:        `You have been assigned${event.isLead ? " as lead" : ""} to a job posting.`,
        entityType:  "JOB",
        entityId:    event.jobId,
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JobApproved Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class JobApprovedTimelineHandler implements IEventHandler<JobApprovedEvent> {
  async handle(event: JobApprovedEvent): Promise<void> {
    await prisma.jobTimeline.create({
      data: {
        tenantId:     event.tenantId,
        jobId:        event.jobId,
        eventType:    event.eventName,
        title:        "Job Approved",
        description:  "Job was approved and set to OPEN status.",
        performedById: event.performedById,
      },
    });
  }
}

export class JobApprovedAuditHandler implements IEventHandler<JobApprovedEvent> {
  async handle(event: JobApprovedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId:     event.tenantId,
        entityType:   "JOB",
        entityId:     event.jobId,
        action:       "APPROVE",
        performedById: event.performedById,
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JobCloned Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class JobClonedTimelineHandler implements IEventHandler<JobClonedEvent> {
  async handle(event: JobClonedEvent): Promise<void> {
    await prisma.jobTimeline.create({
      data: {
        tenantId:     event.tenantId,
        jobId:        event.newJobId,
        eventType:    event.eventName,
        title:        "Job Cloned",
        description:  `Job was cloned from source job ${event.sourceJobId}.`,
        performedById: event.performedById,
        metadata:     { sourceJobId: event.sourceJobId },
      },
    });
  }
}
