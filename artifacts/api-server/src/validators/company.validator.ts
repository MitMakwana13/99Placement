import { z } from "zod";

// ─── Address ──────────────────────────────────────────────────────────────────

export const CompanyAddressSchema = z.object({
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().default("India"),
  addressType: z.string().default("REGISTERED"),
});

// ─── Contact ──────────────────────────────────────────────────────────────────

export const AddContactSchema = z.object({
  name: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  designation: z.string().optional(),
  contactType: z.enum(["HR", "HIRING_MANAGER", "FINANCE", "TECHNICAL", "MANAGEMENT", "OTHER"]).default("HR"),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  notes: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

export const UpdateContactSchema = AddContactSchema.partial();

// ─── Department ───────────────────────────────────────────────────────────────

export const AddDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  headName: z.string().optional(),
  headEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  description: z.string().optional(),
});

// ─── Document ─────────────────────────────────────────────────────────────────

export const AddDocumentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  documentType: z.enum(["GST_CERTIFICATE", "PAN", "NDA", "MSA", "SOW", "CONTRACT", "OTHER"]),
  fileUrl: z.string().url("Invalid file URL"),
  fileKey: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  checksum: z.string().optional(),
});

// ─── Note ─────────────────────────────────────────────────────────────────────

export const CompanyAddNoteSchema = z.object({
  content: z.string().min(1, "Note content cannot be empty"),
  isPrivate: z.boolean().default(false),
});

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const AddTagsSchema = z.object({
  tags: z.array(z.string().min(1)).min(1, "At least one tag is required"),
});

// ─── Recruiter Assignment ─────────────────────────────────────────────────────

export const AssignRecruiterSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  isLead: z.boolean().default(false),
});

// ─── Create Company ───────────────────────────────────────────────────────────

export const CreateCompanySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  cin: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  employeeCount: z.number().int().positive().optional(),
  companyType: z.enum(["PRIVATE_LIMITED", "PUBLIC_LIMITED", "LLP", "PARTNERSHIP", "PROPRIETORSHIP", "OTHER"]).default("PRIVATE_LIMITED"),
  logoUrl: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  description: z.string().optional(),

  address: CompanyAddressSchema.optional(),
  contacts: z.array(AddContactSchema).optional(),
  departments: z.array(AddDepartmentSchema).optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateCompanySchema = CreateCompanySchema.partial();

// ─── Merge ────────────────────────────────────────────────────────────────────

export const MergeCompaniesSchema = z.object({
  sourceCompanyId: z.string().uuid("Invalid source company ID"),
  targetCompanyId: z.string().uuid("Invalid target company ID"),
});

// ─── Query ────────────────────────────────────────────────────────────────────

export const QueryCompanySchema = z.object({
  search: z.string().optional(),
  name: z.string().optional(),
  industry: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  recruiterId: z.string().uuid().optional(),
  status: z.enum(["active", "archived", "deleted"]).optional(),
  tags: z.string().transform((v) => v.split(",").map((t) => t.trim())).optional(),
  companyType: z.string().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),

  limit: z.coerce.number().int().positive().default(10),
  cursor: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const CompanySaveFilterSchema = z.object({
  name: z.string().min(1, "Filter name is required"),
  filters: z.record(z.any()),
});
