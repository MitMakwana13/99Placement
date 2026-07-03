import { pgTable, uuid, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const offerStatusEnum = pgEnum("offer_status", [
  "drafted",
  "sent",
  "accepted",
  "rejected",
  "revoked",
]);

export const salaryNegotiationsTable = pgTable("salary_negotiations", {
  id: uuid("id").primaryKey().defaultRandom(),
  pipelineId: uuid("pipeline_id").notNull().unique(),
  currentCtc: integer("current_ctc"),
  expectedCtc: integer("expected_ctc"),
  offeredCtc: integer("offered_ctc"),
  finalCtc: integer("final_ctc"),
  hikePct: integer("hike_pct"),
  negotiationNotes: text("negotiation_notes"),
  status: text("status").notNull().default("in_progress"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const offerLettersTable = pgTable("offer_letters", {
  id: uuid("id").primaryKey().defaultRandom(),
  pipelineId: uuid("pipeline_id").notNull(),
  offeredCtc: integer("offered_ctc"),
  designation: text("designation"),
  joiningDate: timestamp("joining_date"),
  status: offerStatusEnum("status").notNull().default("drafted"),
  letterUrl: text("letter_url"),
  sentAt: timestamp("sent_at"),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSalaryNegotiationSchema = createInsertSchema(salaryNegotiationsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const insertOfferLetterSchema = createInsertSchema(offerLettersTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type SalaryNegotiation = typeof salaryNegotiationsTable.$inferSelect;
export type OfferLetter = typeof offerLettersTable.$inferSelect;
export type InsertOfferLetter = z.infer<typeof insertOfferLetterSchema>;
