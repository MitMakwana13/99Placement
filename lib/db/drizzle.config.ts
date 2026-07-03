import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  tablesFilter: [
    "employees",
    "companies",
    "company_contacts",
    "requirements",
    "candidates",
    "screening_interviews",
    "screening_criteria_scores",
    "assessment_questions",
    "assessment_templates",
    "assessment_tests",
    "assessment_results",
    "client_interviews",
    "salary_negotiations",
    "offer_letters",
    "joining_status",
    "post_joining_followups",
    "activity_logs",
    "notifications",
    "candidate_timelines",
    "pipeline_activities"
  ],
});
