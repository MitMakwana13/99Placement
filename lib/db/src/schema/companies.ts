import { pgTable, uuid, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// NOTE: companies and company_contacts are now fully managed by Prisma.
// This Drizzle schema mirrors the Prisma-generated columns so Drizzle-based
// routes (requirements, seed, etc.) can still read/write to these tables.

export const companiesTable = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id"),
  name: text("name").notNull(),
  industry: text("industry"),
  website: text("website"),
  gstin: text("gstin"),
  pan: text("pan"),
  cin: text("cin"),
  email: text("email"),
  phone: text("phone"),
  employeeCount: integer("employee_count"),
  companyType: text("company_type").notNull().default("PRIVATE_LIMITED"),
  logoUrl: text("logo_url"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
  deletedAt: timestamp("deleted_at"),
  archivedAt: timestamp("archived_at"),
});

export const companyContactsTable = pgTable("company_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  companyId: uuid("company_id").notNull().references(() => companiesTable.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  designation: text("designation"),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
});

export const insertCompanySchema = createInsertSchema(companiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  archivedAt: true,
});
export const insertCompanyContactSchema = createInsertSchema(companyContactsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companiesTable.$inferSelect;
export type CompanyContact = typeof companyContactsTable.$inferSelect;
