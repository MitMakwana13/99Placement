import { pgTable, uuid, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const candidateSourceEnum = pgEnum("candidate_source", [
  "referral",
  "portal",
  "social",
  "internal",
  "direct",
]);

export const pipelineStageEnum = pgEnum("pipeline_stage", [
  "sourced",
  "screened",
  "assessed",
  "shortlisted",
  "client_interview",
  "offer",
  "joining",
  "post_joining",
  "rejected",
  "dropped",
]);

export const candidatesTable = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  initials: text("initials"),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  currentRole: text("current_role"),
  experienceYears: integer("experience_years"),
  location: text("location"),
  skills: text("skills").array(),
  source: candidateSourceEnum("source").notNull().default("portal"),
  currentCtc: integer("current_ctc"),
  expectedCtc: integer("expected_ctc"),
  noticeDays: integer("notice_days"),
  summary: text("summary"),
  resumeUrl: text("resume_url"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const candidatePipelineTable = pgTable("candidate_pipeline", {
  id: uuid("id").primaryKey().defaultRandom(),
  candidateId: uuid("candidate_id").notNull().references(() => candidatesTable.id),
  requirementId: uuid("requirement_id").notNull(),
  stage: pipelineStageEnum("stage").notNull().default("sourced"),
  assignedRecruiterId: uuid("assigned_recruiter_id"),
  stageUpdatedAt: timestamp("stage_updated_at").notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
