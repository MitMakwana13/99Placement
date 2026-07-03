import { z } from "zod";

// ==========================================
// Authentication & Tenant Schemas
// ==========================================

export const LoginInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RegisterTenantInputSchema = z.object({
  tenantName: z.string().min(2, "Tenant name must be at least 2 characters"),
  tenantSlug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  adminName: z.string().min(2, "Admin name must be at least 2 characters"),
  adminEmail: z.string().email("Invalid email address"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters long"),
});

export type RegisterTenantInput = z.infer<typeof RegisterTenantInputSchema>;

// ==========================================
// Candidate Schemas
// ==========================================

export const CandidateSourceEnum = z.enum(["REFERRAL", "PORTAL", "SOCIAL", "INTERNAL", "DIRECT"]);

export const CreateCandidateInputSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  currentRole: z.string().optional().nullable(),
  experienceYears: z.number().nonnegative().optional().nullable(),
  location: z.string().optional().nullable(),
  skills: z.array(z.string()).default([]),
  source: CandidateSourceEnum.default("PORTAL"),
  currentCtc: z.number().nonnegative().optional().nullable(),
  expectedCtc: z.number().nonnegative().optional().nullable(),
  noticeDays: z.number().nonnegative().optional().nullable(),
  summary: z.string().optional().nullable(),
  resumeUrl: z.string().url("Invalid resume URL").optional().nullable(),
  photoUrl: z.string().url("Invalid photo URL").optional().nullable(),
});

export type CreateCandidateInput = z.infer<typeof CreateCandidateInputSchema>;

// ==========================================
// Job (Requirement) Schemas
// ==========================================

export const UrgencyLevelEnum = z.enum(["CRITICAL", "HIGH", "NORMAL"]);
export const JobStatusEnum = z.enum(["OPEN", "ON_HOLD", "CLOSED", "CANCELLED"]);

export const CreateJobInputSchema = z.object({
  companyId: z.string().uuid("Invalid company ID"),
  recruiterId: z.string().uuid("Invalid recruiter ID").optional().nullable(),
  title: z.string().min(2, "Title must be at least 2 characters"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  jobType: z.string().default("full_time"),
  urgency: UrgencyLevelEnum.default("NORMAL"),
  salaryBand: z.string().optional().nullable(),
  jdText: z.string().optional().nullable(),
  openingsCount: z.number().int().positive().default(1),
  status: JobStatusEnum.default("OPEN"),
  deadline: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .or(z.date().optional().nullable())
    .transform((val) => (val ? new Date(val) : null)),
});

export type CreateJobInput = z.infer<typeof CreateJobInputSchema>;
