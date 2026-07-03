import { pgTable, uuid, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { employeesTable } from "./employees";

export const urgencyEnum = pgEnum("urgency_level", ["critical", "high", "normal"]);
export const requirementStatusEnum = pgEnum("requirement_status", ["open", "on_hold", "closed", "cancelled"]);

export const requirementsTable = pgTable("requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  recruiterId: uuid("recruiter_id").references(() => employeesTable.id),
  title: text("title").notNull(),
  location: text("location").notNull(),
  jobType: text("job_type").notNull().default("full_time"),
  urgency: urgencyEnum("urgency").notNull().default("normal"),
  salaryBand: text("salary_band"),
  jdText: text("jd_text"),
  openingsCount: integer("openings_count").notNull().default(1),
  status: requirementStatusEnum("status").notNull().default("open"),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertRequirementSchema = createInsertSchema(requirementsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});
export type InsertRequirement = z.infer<typeof insertRequirementSchema>;
export type Requirement = typeof requirementsTable.$inferSelect;
