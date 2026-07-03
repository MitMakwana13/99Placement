import { DomainEvent } from "../domain-event";

// ─── Job Created ────────────────────────────────────────────────────────────
export class JobCreatedEvent extends DomainEvent {
  get eventName() { return "JobCreated" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly jobId: string,
    public readonly title: string,
    public readonly companyId: string,
    public readonly performedById: string,
  ) {
    super();
  }
}

// ─── Job Updated ────────────────────────────────────────────────────────────
export class JobUpdatedEvent extends DomainEvent {
  get eventName() { return "JobUpdated" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly jobId: string,
    public readonly changes: Record<string, { old: unknown; new: unknown }>,
    public readonly performedById: string,
  ) {
    super();
  }
}

// ─── Job Closed ─────────────────────────────────────────────────────────────
export class JobClosedEvent extends DomainEvent {
  get eventName() { return "JobClosed" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly jobId: string,
    public readonly reason: string | undefined,
    public readonly performedById: string,
  ) {
    super();
  }
}

// ─── Job Opened ─────────────────────────────────────────────────────────────
export class JobOpenedEvent extends DomainEvent {
  get eventName() { return "JobOpened" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly jobId: string,
    public readonly performedById: string,
  ) {
    super();
  }
}

// ─── Job Archived ───────────────────────────────────────────────────────────
export class JobArchivedEvent extends DomainEvent {
  get eventName() { return "JobArchived" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly jobId: string,
    public readonly performedById: string,
  ) {
    super();
  }
}

// ─── Job Restored ───────────────────────────────────────────────────────────
export class JobRestoredEvent extends DomainEvent {
  get eventName() { return "JobRestored" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly jobId: string,
    public readonly performedById: string,
  ) {
    super();
  }
}

// ─── Job Assigned ───────────────────────────────────────────────────────────
export class JobAssignedEvent extends DomainEvent {
  get eventName() { return "JobAssigned" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly jobId: string,
    public readonly assigneeId: string,
    public readonly assigneeType: "RECRUITER" | "HIRING_MANAGER",
    public readonly isLead: boolean,
    public readonly performedById: string,
  ) {
    super();
  }
}

// ─── Job Approved ───────────────────────────────────────────────────────────
export class JobApprovedEvent extends DomainEvent {
  get eventName() { return "JobApproved" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly jobId: string,
    public readonly performedById: string,
  ) {
    super();
  }
}

// ─── Job Cloned ─────────────────────────────────────────────────────────────
export class JobClonedEvent extends DomainEvent {
  get eventName() { return "JobCloned" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly sourceJobId: string,
    public readonly newJobId: string,
    public readonly performedById: string,
  ) {
    super();
  }
}
