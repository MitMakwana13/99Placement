import { pgTable, uuid, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const verdictEnum = pgEnum("verdict", ["shortlist", "hold", "reject"]);

export const screeningInterviewsTable = pgTable("screening_interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  pipelineId: uuid("pipeline_id").notNull(),
  interviewerId: uuid("interviewer_id").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  conductedAt: timestamp("conducted_at"),
  durationMin: integer("duration_min"),
  mode: text("mode").notNull().default("phone"),
  overallScore: integer("overall_score"),
  verdict: verdictEnum("verdict"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const screeningCriteriaScoresTable = pgTable("screening_criteria_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  screeningId: uuid("screening_id").notNull().references(() => screeningInterviewsTable.id),
  criterion: text("criterion").notNull(),
  score: integer("score").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertScreeningSchema = createInsertSchema(screeningInterviewsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertScreening = z.infer<typeof insertScreeningSchema>;
export type ScreeningInterview = typeof screeningInterviewsTable.$inferSelect;
export type ScreeningCriteriaScore = typeof screeningCriteriaScoresTable.$inferSelect;
