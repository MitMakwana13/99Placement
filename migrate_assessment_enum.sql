-- Migrate assessment_questions.category from assessment_category -> "AssessmentCategory"
BEGIN;

-- Step 1: Add a text staging column
ALTER TABLE assessment_questions ADD COLUMN category_text text;
UPDATE assessment_questions SET category_text = upper(category::text);

-- Step 2: Drop old enum column (FK/index safe - no FKs reference this column)
ALTER TABLE assessment_questions DROP COLUMN category;

-- Step 3: Add new column with Prisma's enum type
ALTER TABLE assessment_questions ADD COLUMN category "AssessmentCategory" NOT NULL DEFAULT 'APTITUDE'::"AssessmentCategory";

-- Step 4: Fill from text column
UPDATE assessment_questions SET category = category_text::"AssessmentCategory";

-- Step 5: Drop staging text column
ALTER TABLE assessment_questions DROP COLUMN category_text;

-- assessment_results: category column (table is empty, so just swap type)
ALTER TABLE assessment_results DROP COLUMN category;
ALTER TABLE assessment_results ADD COLUMN category "AssessmentCategory" NOT NULL DEFAULT 'APTITUDE'::"AssessmentCategory";

COMMIT;
SELECT 'assessment enum migration complete' AS status;
