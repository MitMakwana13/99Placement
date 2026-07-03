import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const interviewVerdictEnum = pgEnum("interview_verdict", [
  "selected",
  "on_hold",
  "rejected",
  "no_show",
]);

export const clientInterviewsTable = pgTable("client_interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  pipelineId: uuid("pipeline_id").notNull(),
  clientContactId: uuid("client_contact_id"),
  interviewerEmployeeId: uuid("interviewer_employee_id"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  mode: text("mode").notNull().default("video"),
  round: text("round").notNull().default("1"),
  feedbackClient: text("feedback_client"),
  feedbackRecruiter: text("feedback_recruiter"),
  verdict: interviewVerdictEnum("verdict"),
  conductedAt: timestamp("conducted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertClientInterviewSchema = createInsertSchema(clientInterviewsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertClientInterview = z.infer<typeof insertClientInterviewSchema>;
export type ClientInterview = typeof clientInterviewsTable.$inferSelect;
