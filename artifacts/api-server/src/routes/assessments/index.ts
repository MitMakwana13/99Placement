import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  assessmentQuestionsTable,
  assessmentTestsTable,
  assessmentResultsTable,
} from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

const router: IRouter = Router();

router.get("/assessment-questions", requireAuth, async (req, res): Promise<void> => {
  const { category, difficulty, limit = "50" } = req.query;
  const conditions = [eq(assessmentQuestionsTable.isActive, true)];
  if (category && typeof category === "string")
    conditions.push(eq(assessmentQuestionsTable.category, category as any));
  if (difficulty && typeof difficulty === "string")
    conditions.push(eq(assessmentQuestionsTable.difficulty, difficulty));

  const rows = await db
    .select()
    .from(assessmentQuestionsTable)
    .where(and(...conditions))
    .limit(Number(limit));

  res.json(rows);
});

router.post("/assessment-questions", requireAuth, async (req, res): Promise<void> => {
  const { category, questionText, options, correctOption, difficulty } = req.body;
  if (!category || !questionText || !options || correctOption == null) {
    res.status(400).json({ error: "category, questionText, options and correctOption required" });
    return;
  }

  const [q] = await db
    .insert(assessmentQuestionsTable)
    .values({ category, questionText, options, correctOption, difficulty: difficulty || "medium" })
    .returning();

  res.status(201).json(q);
});

router.post("/assessments", requireAuth, async (req, res): Promise<void> => {
  const { pipelineId, categories, questionsPerCategory = 5 } = req.body;
  if (!pipelineId) {
    res.status(400).json({ error: "pipelineId required" });
    return;
  }

  let questions: typeof assessmentQuestionsTable.$inferSelect[] = [];
  const cats = categories && Array.isArray(categories) && categories.length > 0
    ? categories
    : ["aptitude", "mathematics", "english", "logical_reasoning", "general_knowledge"];

  for (const cat of cats) {
    const catQs = await db
      .select()
      .from(assessmentQuestionsTable)
      .where(and(eq(assessmentQuestionsTable.category, cat as any), eq(assessmentQuestionsTable.isActive, true)))
      .limit(questionsPerCategory);
    questions = [...questions, ...catQs];
  }

  const [test] = await db
    .insert(assessmentTestsTable)
    .values({
      pipelineId,
      conductedById: req.employee?.employeeId,
      totalQuestions: questions.length,
      maxScore: questions.length,
    })
    .returning();

  res.status(201).json({ ...test, questions });
});

router.get("/assessments/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [test] = await db.select().from(assessmentTestsTable).where(eq(assessmentTestsTable.id, id));
  if (!test) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }

  const results = await db.select().from(assessmentResultsTable).where(eq(assessmentResultsTable.testId, id));
  const questionIds = results.map(r => r.questionId);
  const questions = questionIds.length
    ? await db.select().from(assessmentQuestionsTable).where(inArray(assessmentQuestionsTable.id, questionIds))
    : [];

  res.json({ ...test, questions });
});

// requireAuth added — prevents unauthenticated answer submission
router.post("/assessments/:id/submit", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    res.status(400).json({ error: "answers array required" });
    return;
  }

  const [test] = await db.select().from(assessmentTestsTable).where(eq(assessmentTestsTable.id, id));
  if (!test) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }

  const questionIds = answers.map((a: { questionId: string }) => a.questionId);
  const questions = questionIds.length
    ? await db.select().from(assessmentQuestionsTable).where(inArray(assessmentQuestionsTable.id, questionIds))
    : [];

  const qMap = Object.fromEntries(questions.map(q => [q.id, q]));
  let correct = 0;

  const resultRows = answers.map((a: { questionId: string; selectedOption: number }) => {
    const q = qMap[a.questionId];
    const isCorrect = q ? q.correctOption === a.selectedOption : false;
    if (isCorrect) correct++;
    return {
      testId: id,
      questionId: a.questionId,
      category: q?.category ?? "aptitude" as any,
      selectedOption: a.selectedOption,
      isCorrect,
    };
  });

  if (resultRows.length > 0) {
    await db.insert(assessmentResultsTable).values(resultRows);
  }

  const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  const verdict = pct >= 70 ? "shortlist" : pct >= 50 ? "hold" : "reject";

  const [updated] = await db
    .update(assessmentTestsTable)
    .set({
      correctAnswers: correct,
      totalScore: correct,
      percentage: pct,
      verdict,
      completedAt: new Date(),
    })
    .where(eq(assessmentTestsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Assessment not found" });
    return;
  }

  res.json({ ...updated, questions });
});

// ─── PUBLIC ROUTES FOR CANDIDATES (NO AUTH REQUIRED) ──────────────────────────
import { prisma } from "@workspace/db-prisma";
import { AssessmentService } from "../../services/assessment.service";
import { SubscriptionService } from "../../services/subscription.service";

async function checkCandidatePortalFeature(tenantId: string, res: any): Promise<boolean> {
  const subscription = await SubscriptionService.getSubscription(tenantId);
  const features = (subscription?.plan?.features as any) || {};
  if (!features.candidatePortal) {
    res.status(402).json({ error: "Candidate Portal timed assessment feature is disabled under this workspace's current plan." });
    return false;
  }
  return true;
}

// 1. Get assessment test by ID (Candidate View - Sanitized options/correct answers)
router.get("/public/assessments/:id", async (req, res): Promise<void> => {
  const id = req.params.id;
  try {
    const testRecord = await prisma.assessmentTest.findUnique({ where: { id } });
    if (!testRecord) {
      res.status(404).json({ error: "Assessment session not found" });
      return;
    }
    const isAllowed = await checkCandidatePortalFeature(testRecord.tenantId, res);
    if (!isAllowed) return;

    const sanitizedTest = await AssessmentService.findTestForCandidate(testRecord.tenantId, id);
    res.json(sanitizedTest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Start assessment test (Candidate Action)
router.post("/public/assessments/:id/start", async (req, res): Promise<void> => {
  const id = req.params.id;
  try {
    const testRecord = await prisma.assessmentTest.findUnique({ where: { id } });
    if (!testRecord) {
      res.status(404).json({ error: "Assessment session not found" });
      return;
    }
    const isAllowed = await checkCandidatePortalFeature(testRecord.tenantId, res);
    if (!isAllowed) return;

    const startedTest = await AssessmentService.startTest(testRecord.tenantId, id, "CANDIDATE");
    res.json(startedTest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Submit single answer (Candidate Action - Auto-save)
router.post("/public/assessments/:id/answers", async (req, res): Promise<void> => {
  const id = req.params.id;
  const { questionId, selectedOption } = req.body;
  if (!questionId || selectedOption == null) {
    res.status(400).json({ error: "questionId and selectedOption are required" });
    return;
  }
  try {
    const testRecord = await prisma.assessmentTest.findUnique({ where: { id } });
    if (!testRecord) {
      res.status(404).json({ error: "Assessment session not found" });
      return;
    }
    const isAllowed = await checkCandidatePortalFeature(testRecord.tenantId, res);
    if (!isAllowed) return;

    const result = await AssessmentService.submitAnswer(testRecord.tenantId, id, questionId, selectedOption);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Complete and Grade Assessment (Candidate Action - Final submit)
router.post("/public/assessments/:id/submit", async (req, res): Promise<void> => {
  const id = req.params.id;
  try {
    const testRecord = await prisma.assessmentTest.findUnique({ where: { id } });
    if (!testRecord) {
      res.status(404).json({ error: "Assessment session not found" });
      return;
    }
    const isAllowed = await checkCandidatePortalFeature(testRecord.tenantId, res);
    if (!isAllowed) return;

    const completedTest = await AssessmentService.completeTest(testRecord.tenantId, id, "CANDIDATE");
    res.json(completedTest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
