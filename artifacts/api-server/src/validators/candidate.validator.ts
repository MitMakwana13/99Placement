import { z } from "zod";

export const AddressSchema = z.object({
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  addressType: z.string().default("CURRENT"),
});

export const EducationSchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().min(1, "Field of study is required"),
  institution: z.string().min(1, "Institution is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  percentage: z.number().min(0).max(100).optional(),
  cgpa: z.number().min(0).max(10).optional(),
  isCompleted: z.boolean().default(true),
});

export const ExperienceSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  title: z.string().min(1, "Job title is required"),
  location: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
});

export const SkillItemSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  rating: z.number().int().min(1).max(5).optional(),
  yearsOfExperience: z.number().min(0).optional(),
});

export const LanguageSchema = z.object({
  language: z.string().min(1, "Language is required"),
  proficiency: z.string().min(1, "Proficiency is required"), // BEGINNER, INTERMEDIATE, FLUENT, NATIVE
});

export const CertificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuingOrganization: z.string().min(1, "Issuing organization is required"),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url("Invalid credential URL").optional().or(z.literal("")),
});

export const DocumentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  documentType: z.string().min(1, "Document type is required"), // RESUME, PORTFOLIO, CERTIFICATE, IDENTITY_DOC, etc.
  fileUrl: z.string().url("Invalid file URL"),
  fileKey: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  checksum: z.string().optional(),
});

export const CreateCandidateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  currentRole: z.string().optional(),
  experienceYears: z.number().int().nonnegative().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).optional(),
  source: z.string().default("PORTAL"),
  currentCtc: z.number().int().positive().optional(),
  expectedCtc: z.number().int().positive().optional(),
  noticeDays: z.number().int().nonnegative().optional(),
  summary: z.string().optional(),
  resumeUrl: z.string().url("Invalid resume URL").optional().or(z.literal("")),
  photoUrl: z.string().url("Invalid photo URL").optional().or(z.literal("")),
  questionnaireResponses: z.any().optional(),

  address: AddressSchema.optional(),
  educations: z.array(EducationSchema).optional(),
  experiences: z.array(ExperienceSchema).optional(),
  skillsList: z.array(SkillItemSchema).optional(),
  languages: z.array(LanguageSchema).optional(),
  certifications: z.array(CertificationSchema).optional(),
  documents: z.array(DocumentSchema).optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateCandidateSchema = CreateCandidateSchema.partial();

export const QueryCandidateSchema = z.object({
  search: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  skills: z.string().transform((val) => val.split(",").map((s) => s.trim())).optional(),
  minExperience: z.coerce.number().optional(),
  maxExperience: z.coerce.number().optional(),
  currentCompany: z.string().optional(),
  minCurrentCtc: z.coerce.number().optional(),
  maxCurrentCtc: z.coerce.number().optional(),
  minExpectedCtc: z.coerce.number().optional(),
  maxExpectedCtc: z.coerce.number().optional(),
  maxNoticeDays: z.coerce.number().optional(),
  location: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  tags: z.string().transform((val) => val.split(",").map((t) => t.trim())).optional(),
  recruiterId: z.string().uuid().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),

  // Pagination & Sorting
  limit: z.coerce.number().int().positive().default(10),
  cursor: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const MergeCandidatesSchema = z.object({
  sourceCandidateId: z.string().uuid("Invalid source candidate ID"),
  targetCandidateId: z.string().uuid("Invalid target candidate ID"),
});

export const SaveFilterSchema = z.object({
  name: z.string().min(1, "Filter name is required"),
  filters: z.record(z.any()),
});

export const AddNoteSchema = z.object({
  content: z.string().min(1, "Note content cannot be empty"),
  isPrivate: z.boolean().default(false),
});
