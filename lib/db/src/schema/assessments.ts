import { pgTable, uuid, text, timestamp, integer, pgEnum, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assessmentCategoryEnum = pgEnum("assessment_category", [
  "aptitude",
  "mathematics",
  "english",
  "logical_reasoning",
  "computer_knowledge",
  "general_knowledge",
  "current_affairs",
  "technical",
]);

export const assessmentQuestionsTable = pgTable("assessment_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: assessmentCategoryEnum("category").notNull(),
  questionText: text("question_text").notNull(),
  options: jsonb("options").notNull().$type<string[]>(),
  correctOption: integer("correct_option").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const assessmentTestsTable = pgTable("assessment_tests", {
  id: uuid("id").primaryKey().defaultRandom(),
  pipelineId: uuid("pipeline_id").notNull(),
  conductedById: uuid("conducted_by_id"),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  totalQuestions: integer("total_questions").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  totalScore: integer("total_score").notNull().default(0),
  maxScore: integer("max_score").notNull().default(0),
  percentage: integer("percentage").notNull().default(0),
  verdict: text("verdict"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const assessmentResultsTable = pgTable("assessment_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  testId: uuid("test_id").notNull().references(() => assessmentTestsTable.id),
  questionId: uuid("question_id").notNull().references(() => assessmentQuestionsTable.id),
  category: assessmentCategoryEnum("category").notNull(),
  selectedOption: integer("selected_option"),
  isCorrect: boolean("is_correct").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(assessmentQuestionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertTestSchema = createInsertSchema(assessmentTestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type AssessmentQuestion = typeof assessmentQuestionsTable.$inferSelect;
export type AssessmentTest = typeof assessmentTestsTable.$inferSelect;
export type AssessmentResult = typeof assessmentResultsTable.$inferSelect;
