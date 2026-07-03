import { z } from "zod";

// ── Core CRUD ─────────────────────────────────────────────────────────────────

const BaseJobSchema = z.object({
  companyId:     z.string().uuid(),
  title:         z.string().min(3).max(200),
  code:          z.string().max(50).optional(),
  description:   z.string().max(5000).optional(),
  location:      z.string().min(2).max(200),
  jobType:       z.enum(["full_time", "part_time", "contract", "internship", "freelance"]).default("full_time"),
  urgency:       z.enum(["CRITICAL", "HIGH", "NORMAL"]).default("NORMAL"),
  salaryBand:    z.string().max(100).optional(),
  salaryMin:     z.number().int().nonnegative().optional(),
  salaryMax:     z.number().int().nonnegative().optional(),
  currency:      z.string().default("INR"),
  minExperience: z.number().int().min(0).max(50).optional(),
  maxExperience: z.number().int().min(0).max(50).optional(),
  jdText:        z.string().max(20000).optional(),
  openingsCount: z.number().int().positive().default(1),
  deadline:      z.string().datetime({ offset: true }).optional(),
  departments:   z.array(z.string().min(1)).optional(),
  locations:     z.array(z.object({
    city:    z.string().min(1),
    state:   z.string().optional(),
    country: z.string().default("India"),
  })).optional(),
  requirements:  z.array(z.object({
    description: z.string().min(1),
    isRequired:  z.boolean().default(true),
  })).optional(),
  skills:        z.array(z.object({
    name:       z.string().min(1),
    isRequired: z.boolean().default(true),
  })).optional(),
  questions:     z.array(z.object({
    questionText: z.string().min(1),
    questionType: z.enum(["TEXT", "MULTIPLE_CHOICE", "YES_NO"]).default("TEXT"),
    options:      z.array(z.string()).default([]),
    isRequired:   z.boolean().default(false),
  })).optional(),
  tags:          z.array(z.string().min(1)).optional(),
});

export const CreateJobSchema = BaseJobSchema.refine(
  (d) => !(d.salaryMin !== undefined && d.salaryMax !== undefined && d.salaryMin > d.salaryMax),
  { message: "salaryMin cannot exceed salaryMax", path: ["salaryMin"] },
).refine(
  (d) => !(d.minExperience !== undefined && d.maxExperience !== undefined && d.minExperience > d.maxExperience),
  { message: "minExperience cannot exceed maxExperience", path: ["minExperience"] },
);

export const UpdateJobSchema = BaseJobSchema.partial().omit({ companyId: true }).refine(
  (d) => !(d.salaryMin !== undefined && d.salaryMax !== undefined && d.salaryMin > d.salaryMax),
  { message: "salaryMin cannot exceed salaryMax", path: ["salaryMin"] },
).refine(
  (d) => !(d.minExperience !== undefined && d.maxExperience !== undefined && d.minExperience > d.maxExperience),
  { message: "minExperience cannot exceed maxExperience", path: ["minExperience"] },
);

export const QueryJobSchema = z.object({
  search:          z.string().optional(),
  companyId:       z.string().uuid().optional(),
  recruiterId:     z.string().uuid().optional(),
  hiringManagerId: z.string().uuid().optional(),
  status:          z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "OPEN", "ON_HOLD", "CLOSED", "CANCELLED", "ARCHIVED"]).optional(),
  jobType:         z.enum(["full_time", "part_time", "contract", "internship", "freelance"]).optional(),
  urgency:         z.enum(["CRITICAL", "HIGH", "NORMAL"]).optional(),
  minSalary:       z.coerce.number().optional(),
  maxSalary:       z.coerce.number().optional(),
  minExperience:   z.coerce.number().optional(),
  maxExperience:   z.coerce.number().optional(),
  expiryBefore:    z.string().optional(),
  expiryAfter:     z.string().optional(),
  tags:            z.array(z.string()).optional(),
  skills:          z.array(z.string()).optional(),
  limit:           z.coerce.number().int().positive().max(100).default(20),
  cursor:          z.string().optional(),
  sortBy:          z.enum(["createdAt", "updatedAt", "title", "deadline", "status"]).default("createdAt"),
  sortOrder:       z.enum(["asc", "desc"]).default("desc"),
});

// ── Status Changes ────────────────────────────────────────────────────────────

export const CloseJobSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const CloneJobSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  code:  z.string().max(50).optional(),
});

// ── Assignments ───────────────────────────────────────────────────────────────

export const AssignRecruiterSchema = z.object({
  userId: z.string().uuid(),
  isLead: z.boolean().default(false),
});

export const AssignHiringManagerSchema = z.object({
  userId: z.string().uuid(),
});

// ── Documents ─────────────────────────────────────────────────────────────────

export const AddJobDocumentSchema = z.object({
  name:         z.string().min(1).max(200),
  documentType: z.enum(["JD", "NDA", "CONTRACT", "ASSESSMENT", "OTHER"]),
  fileUrl:      z.string().url(),
  fileKey:      z.string().optional(),
  fileSize:     z.number().int().nonnegative().optional(),
});

// ── Saved Filters ─────────────────────────────────────────────────────────────

export const JobSaveFilterSchema = z.object({
  name:    z.string().min(1).max(100),
  filters: z.record(z.unknown()),
});
