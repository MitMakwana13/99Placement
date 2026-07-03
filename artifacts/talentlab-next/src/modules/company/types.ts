// ─── Address ─────────────────────────────────────────────────────────────────

export interface CompanyAddress {
  id: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: string;
}

// ─── Contact ─────────────────────────────────────────────────────────────────

export type ContactType =
  | "HR"
  | "HIRING_MANAGER"
  | "FINANCE"
  | "TECHNICAL"
  | "MANAGEMENT"
  | "OTHER";

export interface CompanyContact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  designation?: string | null;
  contactType: ContactType;
  linkedinUrl?: string | null;
  notes?: string | null;
  isPrimary: boolean;
  deletedAt?: string | null;
}

// ─── Department ──────────────────────────────────────────────────────────────

export interface CompanyDepartment {
  id: string;
  name: string;
  headName?: string | null;
  headEmail?: string | null;
  description?: string | null;
}

// ─── Document ────────────────────────────────────────────────────────────────

export type CompanyDocumentType =
  | "GST_CERTIFICATE"
  | "PAN"
  | "NDA"
  | "MSA"
  | "SOW"
  | "CONTRACT"
  | "OTHER";

export interface CompanyDocument {
  id: string;
  name: string;
  documentType: CompanyDocumentType;
  fileUrl: string;
  fileKey?: string | null;
  fileSize?: number | null;
  uploadedAt: string;
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

export interface CompanyTag {
  id: string;
  name: string;
}

// ─── Recruiter assignment ─────────────────────────────────────────────────────

export interface CompanyRecruiterAssignment {
  id: string;
  isLead: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// ─── Note ────────────────────────────────────────────────────────────────────

export interface CompanyNote {
  id: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

// ─── Timeline Event ──────────────────────────────────────────────────────────

export interface CompanyTimelineEvent {
  id: string;
  eventType: string;
  description?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
  } | null;
}

// ─── Core Company ────────────────────────────────────────────────────────────

export type CompanyType =
  | "PRIVATE_LIMITED"
  | "PUBLIC_LIMITED"
  | "LLP"
  | "PARTNERSHIP"
  | "PROPRIETORSHIP"
  | "OTHER";

export interface Company {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  gstin?: string | null;
  pan?: string | null;
  cin?: string | null;
  email?: string | null;
  phone?: string | null;
  employeeCount?: number | null;
  companyType: CompanyType;
  logoUrl?: string | null;
  description?: string | null;
  isActive: boolean;
  archivedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;

  // Relations
  address?: CompanyAddress | null;
  contacts?: CompanyContact[];
  departments?: CompanyDepartment[];
  documents?: CompanyDocument[];
  tags?: CompanyTag[];
  recruiters?: CompanyRecruiterAssignment[];
}

// ─── Paginated Result ────────────────────────────────────────────────────────

export interface CompanyPaginatedResult {
  data: Company[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

// ─── Filter Types ────────────────────────────────────────────────────────────

export interface CompanyFilters {
  search?: string;
  industry?: string;
  city?: string;
  state?: string;
  country?: string;
  recruiterId?: string;
  status?: "active" | "archived" | "deleted";
  tags?: string;
  companyType?: string;
  createdFrom?: string;
  createdTo?: string;
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─── Form Types ──────────────────────────────────────────────────────────────

export interface CreateCompanyInput {
  name: string;
  industry?: string;
  website?: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  email?: string;
  phone?: string;
  employeeCount?: number;
  companyType?: CompanyType;
  logoUrl?: string;
  description?: string;
  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  tags?: string[];
}

export type UpdateCompanyInput = Partial<CreateCompanyInput>;

export interface CreateContactInput {
  name: string;
  email?: string;
  phone?: string;
  designation?: string;
  contactType?: ContactType;
  linkedinUrl?: string;
  notes?: string;
  isPrimary?: boolean;
}

export interface AddNoteInput {
  content: string;
  isPrivate?: boolean;
}

export interface AddDocumentInput {
  name: string;
  documentType: CompanyDocumentType;
  fileUrl: string;
  fileKey?: string;
  fileSize?: number;
}
