import { z } from "zod";
import { PipelineStage } from "@prisma/client";

// Stage enum for validation
const PipelineStageSchema = z.nativeEnum(PipelineStage);

// ── Core CRUD Schemas ────────────────────────────────────────────────────────

export const CreatePipelineSchema = z.object({
  candidateId:        z.string().uuid(),
  jobId:              z.string().uuid(),
  stage:              PipelineStageSchema.optional(),
  assignedRecruiterId: z.string().uuid().optional(),
  notes:              z.string().max(2000).optional(),
});

export const UpdateStageSchema = z.object({
  newStage: PipelineStageSchema,
  reason:   z.string().max(1000).optional(),
});

export const BulkUpdateStageSchema = z.object({
  ids:      z.array(z.string().uuid()).min(1),
  newStage: PipelineStageSchema,
  reason:   z.string().max(1000).optional(),
});

export const QueryPipelineSchema = z.object({
  candidateId:         z.string().uuid().optional(),
  jobId:               z.string().uuid().optional(),
  stage:               PipelineStageSchema.optional(),
  assignedRecruiterId: z.string().uuid().optional(),
  search:              z.string().optional(),
  limit:               z.coerce.number().int().positive().max(100).default(20),
  cursor:              z.string().optional(),
  sortBy:              z.enum(["createdAt", "updatedAt", "stageUpdatedAt"]).default("createdAt"),
  sortOrder:           z.enum(["asc", "desc"]).default("desc"),
});

// ── Sub-resource Schemas ─────────────────────────────────────────────────────

export const PipelineNoteSchema = z.object({
  content:   z.string().min(1).max(5000),
  isPrivate: z.boolean().default(false),
});

export const PipelineAttachmentSchema = z.object({
  name:     z.string().min(1).max(255),
  fileUrl:  z.string().url(),
  fileKey:  z.string().optional(),
  fileSize: z.number().int().nonnegative().optional(),
});

export const PipelineRatingSchema = z.object({
  recruiterRating: z.number().int().min(1).max(5).optional(),
  technicalRating: z.number().int().min(1).max(5).optional(),
  hrRating:        z.number().int().min(1).max(5).optional(),
  overallRating:   z.number().int().min(1).max(5).optional(),
  feedback:        z.string().max(5000).optional(),
}).refine(
  (data) =>
    data.recruiterRating !== undefined ||
    data.technicalRating !== undefined ||
    data.hrRating !== undefined ||
    data.overallRating !== undefined,
  {
    message: "At least one rating field (recruiter, technical, HR, or overall) must be provided.",
    path: ["overallRating"],
  }
);

export const PipelineChecklistItemSchema = z.object({
  itemKey:     z.string().min(1).max(50),
  title:       z.string().min(1).max(100),
  isCompleted: z.boolean().default(false),
});

export const PipelineChecklistUpdateSchema = z.object({
  isCompleted: z.boolean(),
});

export const PipelineReminderSchema = z.object({
  userId:       z.string().uuid(),
  title:        z.string().min(1).max(255),
  description:  z.string().max(1000).optional(),
  reminderType: z.string().min(1).max(50),
  remindAt:     z.string().datetime({ offset: true }).transform(str => new Date(str)),
});
