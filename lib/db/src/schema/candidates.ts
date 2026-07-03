import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// NOTE: candidate_source and pipeline_stage enums are now managed by Prisma
// (as "CandidateSource" and "PipelineStage" uppercase variants in the DB).
// We use `text` here to avoid enum conflicts while still reading/writing correctly.

export const candidatesTable = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: text("name").notNull(),
  initials: text("initials"),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  currentRole: text("current_role"),
  experienceYears: integer("experience_years"),
  location: text("location"),
  skills: text("skills").array(),
  source: text("source").notNull().default("PORTAL"),
  currentCtc: integer("current_ctc"),
  expectedCtc: integer("expected_ctc"),
  noticeDays: integer("notice_days"),
  summary: text("summary"),
  resumeUrl: text("resume_url"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
});

export const candidatePipelineTable = pgTable("candidate_pipeline", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  candidateId: uuid("candidate_id").notNull().references(() => candidatesTable.id),
  requirementId: uuid("job_id"), // Maps to job_id column in database
  // stage uses Prisma's "PipelineStage" enum (uppercase values: SOURCED, SCREENED, etc.)
  stage: text("stage").notNull().default("SOURCED"),
  assignedRecruiterId: uuid("assigned_recruiter_id"),
  stageUpdatedAt: timestamp("stage_updated_at").notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
});

export const insertCandidateSchema = createInsertSchema(candidatesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export const insertPipelineSchema = createInsertSchema(candidatePipelineTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stageUpdatedAt: true,
});
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidatesTable.$inferSelect;
export type CandidatePipeline = typeof candidatePipelineTable.$inferSelect;
