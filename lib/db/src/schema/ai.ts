import { pgTable, uuid, text, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { candidatePipelineTable } from "./candidates";

// AI Analyses — stores all AI-generated results per pipeline entry
export const aiAnalysesTable = pgTable("ai_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  pipelineId: uuid("pipeline_id")
    .notNull()
    .references(() => candidatePipelineTable.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("openai"), // openai | gemini | anthropic | custom
  model: text("model"),
  resumeParsed: jsonb("resume_parsed"),        // { name, skills, experience, education }
  screeningScore: jsonb("screening_score"),    // { communication, experience, skills, education, overall, recommendation }
  matchScore: jsonb("match_score"),            // { matchPercentage, matchedSkills, missingSkills, summary }
  rankScore: real("rank_score"),               // float 0-100
  candidateSummary: text("candidate_summary"),
  interviewQuestions: jsonb("interview_questions"), // string[]
  assessmentRec: text("assessment_rec"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
});

export type AiAnalysis = typeof aiAnalysesTable.$inferSelect;

// Candidate Share Links — secure token links for client review
export const candidateShareLinksTable = pgTable("candidate_share_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  pipelineId: uuid("pipeline_id")
    .notNull()
    .references(() => candidatePipelineTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(), // secure random token
  expiresAt: timestamp("expires_at").notNull(),
  isActive: text("is_active").notNull().default("true"), // using text for drizzle compat
  clientDecision: text("client_decision"),   // APPROVED | REJECTED | NEED_INTERVIEW
  clientFeedback: text("client_feedback"),
  viewedAt: timestamp("viewed_at"),
  createdById: uuid("created_by_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CandidateShareLink = typeof candidateShareLinksTable.$inferSelect;

// Candidate Allocation Statuses
export const candidateAllocationStatusTable = pgTable("candidate_allocation_statuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  candidateId: uuid("candidate_id").notNull().unique(), // one status per candidate globally
  status: text("status").notNull().default("AVAILABLE"), // AVAILABLE | ALLOCATED | INTERVIEW_SCHEDULED | SELECTED | OFFER_RELEASED | JOINED | REJECTED | ON_HOLD | BLACKLISTED
  reason: text("reason"),
  updatedById: uuid("updated_by_id"),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CandidateAllocationStatus = typeof candidateAllocationStatusTable.$inferSelect;
