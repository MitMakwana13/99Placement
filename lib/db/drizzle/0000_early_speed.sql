CREATE TYPE "public"."employee_role" AS ENUM('admin', 'recruiter', 'hr', 'client');--> statement-breakpoint
CREATE TYPE "public"."requirement_status" AS ENUM('open', 'on_hold', 'closed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."urgency_level" AS ENUM('critical', 'high', 'normal');--> statement-breakpoint
CREATE TYPE "public"."candidate_source" AS ENUM('referral', 'portal', 'social', 'internal', 'direct');--> statement-breakpoint
CREATE TYPE "public"."pipeline_stage" AS ENUM('sourced', 'screened', 'assessed', 'shortlisted', 'client_interview', 'offer', 'joining', 'post_joining', 'rejected', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('shortlist', 'hold', 'reject');--> statement-breakpoint
CREATE TYPE "public"."assessment_category" AS ENUM('aptitude', 'mathematics', 'english', 'logical_reasoning', 'computer_knowledge', 'general_knowledge', 'current_affairs', 'technical');--> statement-breakpoint
CREATE TYPE "public"."interview_verdict" AS ENUM('selected', 'on_hold', 'rejected', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('drafted', 'sent', 'accepted', 'rejected', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."retention_status" AS ENUM('retained', 'resigned', 'terminated', 'unknown');--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "employee_role" DEFAULT 'recruiter' NOT NULL,
	"company_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "employees_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"website" text,
	"gstin" text,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "company_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"designation" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"recruiter_id" uuid,
	"title" text NOT NULL,
	"location" text NOT NULL,
	"job_type" text DEFAULT 'full_time' NOT NULL,
	"urgency" "urgency_level" DEFAULT 'normal' NOT NULL,
	"salary_band" text,
	"jd_text" text,
	"openings_count" integer DEFAULT 1 NOT NULL,
	"status" "requirement_status" DEFAULT 'open' NOT NULL,
	"deadline" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "candidate_pipeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"requirement_id" uuid NOT NULL,
	"stage" "pipeline_stage" DEFAULT 'sourced' NOT NULL,
	"assigned_recruiter_id" uuid,
	"stage_updated_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"initials" text,
	"email" text NOT NULL,
	"phone" text,
	"current_role" text,
	"experience_years" integer,
	"location" text,
	"skills" text[],
	"source" "candidate_source" DEFAULT 'portal' NOT NULL,
	"current_ctc" integer,
	"expected_ctc" integer,
	"notice_days" integer,
	"summary" text,
	"resume_url" text,
	"photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "candidates_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "screening_criteria_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"screening_id" uuid NOT NULL,
	"criterion" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screening_interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"interviewer_id" uuid NOT NULL,
	"scheduled_at" timestamp,
	"conducted_at" timestamp,
	"duration_min" integer,
	"mode" text DEFAULT 'phone' NOT NULL,
	"overall_score" integer,
	"verdict" "verdict",
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "assessment_category" NOT NULL,
	"question_text" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_option" integer NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"category" "assessment_category" NOT NULL,
	"selected_option" integer,
	"is_correct" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"conducted_by_id" uuid,
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"correct_answers" integer DEFAULT 0 NOT NULL,
	"total_score" integer DEFAULT 0 NOT NULL,
	"max_score" integer DEFAULT 0 NOT NULL,
	"percentage" integer DEFAULT 0 NOT NULL,
	"verdict" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"client_contact_id" uuid,
	"interviewer_employee_id" uuid,
	"scheduled_at" timestamp NOT NULL,
	"mode" text DEFAULT 'video' NOT NULL,
	"round" text DEFAULT '1' NOT NULL,
	"feedback_client" text,
	"feedback_recruiter" text,
	"verdict" "interview_verdict",
	"conducted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offer_letters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"offered_ctc" integer,
	"designation" text,
	"joining_date" timestamp,
	"status" "offer_status" DEFAULT 'drafted' NOT NULL,
	"letter_url" text,
	"sent_at" timestamp,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_negotiations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"current_ctc" integer,
	"expected_ctc" integer,
	"offered_ctc" integer,
	"final_ctc" integer,
	"hike_pct" integer,
	"negotiation_notes" text,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "salary_negotiations_pipeline_id_unique" UNIQUE("pipeline_id")
);
--> statement-breakpoint
CREATE TABLE "joining_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"joining_date" timestamp,
	"actual_joined_at" timestamp,
	"notice_period_days" integer,
	"notice_start_date" timestamp,
	"bgv_status" text DEFAULT 'pending' NOT NULL,
	"doc_collection_status" text DEFAULT 'pending' NOT NULL,
	"laptop_issued" boolean DEFAULT false NOT NULL,
	"id_card_issued" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "joining_status_pipeline_id_unique" UNIQUE("pipeline_id")
);
--> statement-breakpoint
CREATE TABLE "post_joining_followups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"check_type" text NOT NULL,
	"scheduled_at" timestamp,
	"conducted_at" timestamp,
	"notes" text,
	"retention_status" "retention_status" DEFAULT 'unknown' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" text NOT NULL,
	"performed_by_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"scheduled_for" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_recruiter_id_employees_id_fk" FOREIGN KEY ("recruiter_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_pipeline" ADD CONSTRAINT "candidate_pipeline_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_criteria_scores" ADD CONSTRAINT "screening_criteria_scores_screening_id_screening_interviews_id_fk" FOREIGN KEY ("screening_id") REFERENCES "public"."screening_interviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_test_id_assessment_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."assessment_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_question_id_assessment_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."assessment_questions"("id") ON DELETE no action ON UPDATE no action;