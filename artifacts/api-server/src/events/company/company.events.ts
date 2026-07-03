import { DomainEvent } from "../domain-event";

// ---------------------------------------------------------------------------
// CompanyCreatedEvent
// ---------------------------------------------------------------------------
export class CompanyCreatedEvent extends DomainEvent {
  get eventName() { return "CompanyCreated" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly companyId: string,
    public readonly performedById?: string
  ) { super(); }
}

// ---------------------------------------------------------------------------
// CompanyUpdatedEvent
// ---------------------------------------------------------------------------
export class CompanyUpdatedEvent extends DomainEvent {
  get eventName() { return "CompanyUpdated" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly companyId: string,
    public readonly changes: Record<string, { old: unknown; new: unknown }>,
    public readonly performedById?: string
  ) { super(); }
}

// ---------------------------------------------------------------------------
// CompanyArchivedEvent
// ---------------------------------------------------------------------------
export class CompanyArchivedEvent extends DomainEvent {
  get eventName() { return "CompanyArchived" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly companyId: string,
    public readonly performedById?: string
  ) { super(); }
}

// ---------------------------------------------------------------------------
// CompanyRestoredEvent
// ---------------------------------------------------------------------------
export class CompanyRestoredEvent extends DomainEvent {
  get eventName() { return "CompanyRestored" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly companyId: string,
    public readonly performedById?: string
  ) { super(); }
}

// ---------------------------------------------------------------------------
// CompanyMergedEvent
// ---------------------------------------------------------------------------
export class CompanyMergedEvent extends DomainEvent {
  get eventName() { return "CompanyMerged" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly sourceCompanyId: string,
    public readonly targetCompanyId: string,
    public readonly performedById?: string
  ) { super(); }
}

// ---------------------------------------------------------------------------
// RecruiterAssignedEvent
// ---------------------------------------------------------------------------
export class RecruiterAssignedEvent extends DomainEvent {
  get eventName() { return "RecruiterAssigned" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly companyId: string,
    public readonly userId: string,
    public readonly isLead: boolean,
    public readonly performedById?: string
  ) { super(); }
}

// ---------------------------------------------------------------------------
// ContactCreatedEvent
// ---------------------------------------------------------------------------
export class ContactCreatedEvent extends DomainEvent {
  get eventName() { return "ContactCreated" as const; }
  constructor(
    public readonly tenantId: string,
    public readonly companyId: string,
    public readonly contactId: string,
    public readonly performedById?: string
  ) { super(); }
}
