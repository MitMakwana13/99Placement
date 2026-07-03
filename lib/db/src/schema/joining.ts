import { pgTable, uuid, text, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const retentionStatusEnum = pgEnum("retention_status", [
  "retained",
  "resigned",
  "terminated",
  "unknown",
]);

export const joiningStatusTable = pgTable("joining_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  pipelineId: uuid("pipeline_id").notNull().unique(),
  joiningDate: timestamp("joining_date"),
  actualJoinedAt: timestamp("actual_joined_at"),
  noticePeriodDays: integer("notice_period_days"),
  noticeStartDate: timestamp("notice_start_date"),
  bgvStatus: text("bgv_status").notNull().default("pending"),
  docCollectionStatus: text("doc_collection_status").notNull().default("pending"),
  laptopIssued: boolean("laptop_issued").notNull().default(false),
  idCardIssued: boolean("id_card_issued").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const postJoiningFollowupsTable = pgTable("post_joining_followups", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  pipelineId: uuid("pipeline_id").notNull(),
  checkType: text("check_type").notNull(), // "30_day" | "60_day" | "90_day"
  scheduledAt: timestamp("scheduled_at"),
  conductedAt: timestamp("conducted_at"),
  notes: text("notes"),
  retentionStatus: retentionStatusEnum("retention_status").notNull().default("unknown"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertJoiningStatusSchema = createInsertSchema(joiningStatusTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type JoiningStatus = typeof joiningStatusTable.$inferSelect;
export type PostJoiningFollowup = typeof postJoiningFollowupsTable.$inferSelect;
export type InsertJoiningStatus = z.infer<typeof insertJoiningStatusSchema>;
