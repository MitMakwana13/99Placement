import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/auth";
import { prisma } from "@workspace/db-prisma";
import { AssessmentCategory } from "@prisma/client";
import { AssessmentService } from "../../services/assessment.service";
import { SubscriptionService } from "../../services/subscription.service";

const router: IRouter = Router();

const normalizeCategory = (c: string): AssessmentCategory => {
  const map: Record<string, AssessmentCategory> = {
    aptitude: AssessmentCategory.APTITUDE,
    mathematics: AssessmentCategory.MATHEMATICS,
    english: AssessmentCategory.ENGLISH,
    logical_reasoning: AssessmentCategory.LOGICAL_REASONING,
    computer_knowledge: AssessmentCategory.COMPUTER_KNOWLEDGE,
    general_knowledge: AssessmentCategory.GENERAL_KNOWLEDGE,
    current_affairs: AssessmentCategory.CURRENT_AFFAIRS,
    technical: AssessmentCategory.TECHNICAL,
  };
  return map[c.toLowerCase()] ?? AssessmentCategory.APTITUDE;
};

router.get("/assessment-questions", requireAuth, async (req, res): Promise<void> => {
  const { category, difficulty, limit = "50" } = req.query;
  const where: any = {
    isActive: true,
  };
  if (category && typeof category === "string") {
    where.category = normalizeCategory(category);
  }
  if (difficulty && typeof difficulty === "string") {
    where.difficulty = difficulty;
  }

  try {
    const rows = await prisma.assessmentQuestion.findMany({
      where,
      take: Number(limit),
    });
    res.json(rows);
  } catch (err: any) {
    console.error("Error fetching assessment questions:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/assessment-questions", requireAuth, async (req, res): Promise<void> => {
  const { category, questionText, options, correctOption, difficulty } = req.body;
  if (!category || !questionText || !options || correctOption == null) {
    res.status(400).json({ error: "category, questionText, options and correctOption required" });
    return;
  }

  try {
    const q = await prisma.assessmentQuestion.create({
      data: {
        category: normalizeCategory(category),
        questionText,
        options: Array.isArray(options) ? options : [options],
        correctOption: Number(correctOption),
        difficulty: difficulty || "medium",
      },
    });
    res.status(201).json(q);
  } catch (err: any) {
    console.error("Error creating assessment question:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/assessments", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.context?.tenantId || req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const { pipelineId, categories, questionsPerCategory = 5 } = req.body;
  if (!pipelineId) {
    res.status(400).json({ error: "pipelineId required" });
    return;
  }

  const cats = categories && Array.isArray(categories) && categories.length > 0
    ? categories
    : ["aptitude", "mathematics", "english", "logical_reasoning", "general_knowledge"];

  try {
    let questions: any[] = [];
    for (const cat of cats) {
      const catQs = await prisma.assessmentQuestion.findMany({
        where: {
          category: normalizeCategory(cat),
          isActive: true,
        },
        take: Number(questionsPerCategory),
      });
      questions = [...questions, ...catQs];
    }

    const test = await prisma.assessmentTest.create({
      data: {
        tenantId,
        pipelineId,
        conductedById: req.employee?.employeeId || req.user?.userId || undefined,
        totalQuestions: questions.length,
        maxScore: questions.length,
      },
    });

    res.status(201).json({ ...test, questions });
  } catch (err: any) {
    console.error("Error creating assessment test:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/assessments/:id", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.context?.tenantId || req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const test = await prisma.assessmentTest.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!test) {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    const results = await prisma.assessmentResult.findMany({
      where: {
        testId: id,
      },
    });

    const questionIds = results.map(r => r.questionId);
    const questions = questionIds.length
      ? await prisma.assessmentQuestion.findMany({
          where: {
            id: {
              in: questionIds,
            },
          },
        })
      : [];

    res.json({ ...test, questions });
  } catch (err: any) {
    console.error("Error fetching assessment test:", err);
    res.status(500).json({ error: err.message });
  }
});

// requireAuth added — prevents unauthenticated answer submission
router.post("/assessments/:id/submit", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.context?.tenantId || req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    res.status(400).json({ error: "answers array required" });
    return;
  }

  try {
    const test = await prisma.assessmentTest.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!test) {
      res.status(404).json({ error: "Assessment not found" });
      return;
    }

    const questionIds = answers.map((a: { questionId: string }) => a.questionId);
    const questions = questionIds.length
      ? await prisma.assessmentQuestion.findMany({
          where: {
            id: {
              in: questionIds,
            },
          },
        })
      : [];

    const qMap = Object.fromEntries(questions.map(q => [q.id, q]));
    let correct = 0;

    const resultData = answers.map((a: { questionId: string; selectedOption: number }) => {
      const q = qMap[a.questionId];
      const isCorrect = q ? q.correctOption === a.selectedOption : false;
      if (isCorrect) correct++;
      return {
        testId: id,
        questionId: a.questionId,
        category: q ? q.category : AssessmentCategory.APTITUDE,
        selectedOption: a.selectedOption,
        isCorrect,
      };
    });

    if (resultData.length > 0) {
      await prisma.assessmentResult.createMany({
        data: resultData,
      });
    }

    const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const verdict = pct >= 70 ? "shortlist" : pct >= 50 ? "hold" : "reject";

    const updated = await prisma.assessmentTest.update({
      where: {
        id,
      },
      data: {
        correctAnswers: correct,
        totalScore: correct,
        percentage: pct,
        verdict,
        completedAt: new Date(),
      },
    });

    res.json({ ...updated, questions });
  } catch (err: any) {
    console.error("Error submitting assessment test:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUBLIC ROUTES FOR CANDIDATES (NO AUTH REQUIRED) ──────────────────────────
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
