-- Recreate the employees and requirements tables that Prisma dropped
-- These are managed by Drizzle schema (lib/db) not Prisma (lib/db-prisma)

-- Create employee_role enum if not exists
DO $$ BEGIN
  CREATE TYPE employee_role AS ENUM ('admin', 'recruiter', 'hr', 'client');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create urgency_level enum if not exists
DO $$ BEGIN
  CREATE TYPE urgency_level AS ENUM ('critical', 'high', 'normal');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create requirement_status enum if not exists
DO $$ BEGIN
  CREATE TYPE requirement_status AS ENUM ('open', 'on_hold', 'closed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Recreate employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role employee_role NOT NULL DEFAULT 'recruiter',
  company_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  deleted_at timestamp
);

-- Recreate requirements table
CREATE TABLE IF NOT EXISTS requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id),
  recruiter_id uuid REFERENCES employees(id),
  title text NOT NULL,
  location text NOT NULL,
  job_type text NOT NULL DEFAULT 'full_time',
  urgency urgency_level NOT NULL DEFAULT 'normal',
  salary_band text,
  jd_text text,
  openings_count integer NOT NULL DEFAULT 1,
  status requirement_status NOT NULL DEFAULT 'open',
  deadline timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  deleted_at timestamp
);

-- Update candidate_pipeline requirement_id FK if requirements table was missing
-- (FK may have been dropped; add it back if not present)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'candidate_pipeline_requirement_id_fkey'
  ) THEN
    ALTER TABLE candidate_pipeline ADD CONSTRAINT candidate_pipeline_requirement_id_fkey
      FOREIGN KEY (requirement_id) REFERENCES requirements(id);
  END IF;
END $$;

SELECT 'tables recreated successfully' AS status;
