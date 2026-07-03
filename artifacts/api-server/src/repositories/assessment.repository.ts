/**
 * Assessment Repository
 *
 * Handles all database interactions for the 99 Placement Assessment & Scorecard Engine.
 */

import { prisma, Prisma } from "@workspace/db-prisma";
import { AppError } from "../utils/app-error";

// ── Mappings for Difficulty Weights ──────────────────────────────────────────
export const DIFFICULTY_WEIGHTS: Record<string, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
};

const TEST_INCLUDE = {
  pipeline: {
    select: {
      id: true,
      stage: true,
      candidate: { select: { id: true, name: true, email: true } },
      job: { select: { id: true, title: true, code: true } },
    },
  },
  conductedBy: { select: { id: true, name: true, email: true } },
  template: {
    select: { id: true, name: true, passPercentage: true, durationMinutes: true },
  },
  results: {
    include: {
      question: {
        select: {
          id: true,
          category: true,
          questionText: true,
          options: true,
          correctOption: true,
          difficulty: true,
        },
      },
    },
  },
} satisfies Prisma.AssessmentTestInclude;

export const AssessmentRepository = {
  // ── Template CRUD ─────────────────────────────────────────────────────────

  async createTemplate(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      passPercentage: number;
      durationMinutes: number;
      randomizationRules?: any;
    },
  ) {
    return prisma.assessmentTemplate.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        passPercentage: data.passPercentage,
        durationMinutes: data.durationMinutes,
        randomizationRules: data.randomizationRules ?? null,
      },
    });
  },

  async findTemplateById(tenantId: string, id: string) {
    const template = await prisma.assessmentTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!template) {
      throw new AppError("Assessment template not found.", 404);
    }
    return template;
  },

  async updateTemplate(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      description?: string;
      passPercentage?: number;
      durationMinutes?: number;
      randomizationRules?: any;
    },
  ) {
    await this.findTemplateById(tenantId, id);
    return prisma.assessmentTemplate.update({
      where: { id },
      data,
    });
  },

  async deleteTemplate(tenantId: string, id: string) {
    await this.findTemplateById(tenantId, id);
    return prisma.assessmentTemplate.delete({ where: { id } });
  },

  async listTemplates(tenantId: string) {
    return prisma.assessmentTemplate.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  },

  // ── Question Bank CRUD ─────────────────────────────────────────────────────

  async createQuestion(data: {
    category: any; // AssessmentCategory enum
    questionText: string;
    options: string[];
    correctOption: number;
    difficulty?: string;
    isActive?: boolean;
    version?: number;
    parentId?: string;
  }) {
    return prisma.assessmentQuestion.create({
      data: {
        category: data.category,
        questionText: data.questionText,
        options: data.options,
        correctOption: data.correctOption,
        difficulty: data.difficulty ?? "medium",
        isActive: data.isActive ?? true,
        version: data.version ?? 1,
        parentId: data.parentId ?? null,
      },
    });
  },

  async findQuestionById(id: string) {
    const question = await prisma.assessmentQuestion.findUnique({ where: { id } });
    if (!question) {
      throw new AppError("Question not found.", 404);
    }
    return question;
  },

  /**
   * Question edits spawn a new version instead of overwriting history.
   */
  async updateQuestion(
    id: string,
    data: {
      category?: any;
      questionText?: string;
      options?: string[];
      correctOption?: number;
      difficulty?: string;
      isActive?: boolean;
    },
  ) {
    const original = await this.findQuestionById(id);

    const isStructuralChange =
      (data.questionText !== undefined && data.questionText !== original.questionText) ||
      (data.options !== undefined && JSON.stringify(data.options) !== JSON.stringify(original.options)) ||
      (data.correctOption !== undefined && data.correctOption !== original.correctOption) ||
      (data.category !== undefined && data.category !== original.category) ||
      (data.difficulty !== undefined && data.difficulty !== original.difficulty);

    if (isStructuralChange) {
      // 1. Deactivate original question
      await prisma.assessmentQuestion.update({
        where: { id },
        data: { isActive: false },
      });

      // 2. Create new version linked to the parent
      return prisma.assessmentQuestion.create({
        data: {
          category: data.category ?? original.category,
          questionText: data.questionText ?? original.questionText,
          options: data.options ?? original.options,
          correctOption: data.correctOption ?? original.correctOption,
          difficulty: data.difficulty ?? original.difficulty,
          isActive: data.isActive ?? true,
          version: original.version + 1,
          parentId: original.parentId ?? original.id,
        },
      });
    } else {
      // Simple updates (like just changing isActive flag) update in place
      return prisma.assessmentQuestion.update({
        where: { id },
        data,
      });
    }
  },

  async deleteQuestion(id: string) {
    await this.findQuestionById(id);
    return prisma.assessmentQuestion.delete({ where: { id } });
  },

  async listQuestions(
    filters: {
      category?: any;
      difficulty?: string;
      isActive?: boolean;
    },
    options: { page?: number; pageSize?: number } = {},
  ) {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.AssessmentQuestionWhereInput = {
      ...(filters.category && { category: filters.category }),
      ...(filters.difficulty && { difficulty: filters.difficulty }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    };

    const [items, total] = await Promise.all([
      prisma.assessmentQuestion.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.assessmentQuestion.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  // ── Assessment Test Management ─────────────────────────────────────────────

  async assignTest(
    tenantId: string,
    data: {
      pipelineId: string;
      templateId?: string;
      conductedById?: string;
      passPercentage?: number;
      durationMinutes?: number;
      scheduledAt?: Date;
    },
    questionIds: string[],
  ) {
    const attemptsCount = await prisma.assessmentTest.count({
      where: { tenantId, pipelineId: data.pipelineId },
    });

    const attemptNumber = attemptsCount + 1;

    const questions = await prisma.assessmentQuestion.findMany({
      where: { id: { in: questionIds } },
    });

    if (questions.length === 0) {
      throw new AppError("Cannot assign a test with 0 questions.", 400);
    }

    return prisma.$transaction(async (tx) => {
      const test = await tx.assessmentTest.create({
        data: {
          tenantId,
          pipelineId: data.pipelineId,
          templateId: data.templateId ?? null,
          conductedById: data.conductedById,
          scheduledAt: data.scheduledAt ?? new Date(),
          attemptNumber,
          passPercentage: data.passPercentage ?? 50,
          durationMinutes: data.durationMinutes ?? 45,
          totalQuestions: questions.length,
          results: {
            create: questions.map((q) => ({
              questionId: q.id,
              category: q.category,
              selectedOption: null,
              isCorrect: false,
            })),
          },
        },
        include: TEST_INCLUDE,
      });

      return test;
    });
  },

  async findTestById(tenantId: string, id: string) {
    const test = await prisma.assessmentTest.findFirst({
      where: { id, tenantId },
      include: TEST_INCLUDE,
    });

    if (!test) {
      throw new AppError("Assessment test not found.", 404);
    }

    return test;
  },

  async listTests(
    tenantId: string,
    filters: {
      pipelineId?: string;
      verdict?: string;
    },
    options: { page?: number; pageSize?: number } = {},
  ) {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.AssessmentTestWhereInput = {
      tenantId,
      ...(filters.pipelineId && { pipelineId: filters.pipelineId }),
      ...(filters.verdict && { verdict: filters.verdict }),
    };

    const [items, total] = await Promise.all([
      prisma.assessmentTest.findMany({
        where,
        include: TEST_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.assessmentTest.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async startTest(tenantId: string, id: string) {
    const test = await this.findTestById(tenantId, id);

    if (test.completedAt) {
      throw new AppError("Cannot start an already completed test.", 400);
    }

    if (test.startedAt) {
      throw new AppError("Test has already been started.", 400);
    }

    return prisma.assessmentTest.update({
      where: { id },
      data: { startedAt: new Date() },
      include: TEST_INCLUDE,
    });
  },

  async submitAnswer(tenantId: string, testId: string, questionId: string, selectedOption: number) {
    const test = await this.findTestById(tenantId, testId);

    // Enforce Immutability: block modifications if completed
    if (test.completedAt) {
      throw new AppError("Cannot submit answers for a completed test. History is immutable.", 400);
    }

    // Server-Authoritative Timer Enforcement
    if (test.startedAt) {
      const expirationTime = new Date(test.startedAt.getTime() + test.durationMinutes * 60 * 1000);
      if (new Date() > expirationTime) {
        throw new AppError("Time limit has expired for this test.", 400);
      }
    } else {
      throw new AppError("Test must be started before submitting answers.", 400);
    }

    const resultSlot = await prisma.assessmentResult.findFirst({
      where: { testId, questionId },
      include: { question: true },
    });

    if (!resultSlot) {
      throw new AppError("Question is not part of this assessment test.", 400);
    }

    const isCorrect = resultSlot.question.correctOption === selectedOption;

    await prisma.assessmentResult.update({
      where: { id: resultSlot.id },
      data: { selectedOption, isCorrect },
    });

    return { success: true, isCorrect };
  },

  /**
   * Evaluate and complete test.
   */
  async completeTest(tenantId: string, id: string) {
    const test = await prisma.assessmentTest.findFirst({
      where: { id, tenantId },
      include: {
        results: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!test) {
      throw new AppError("Assessment test not found.", 404);
    }

    // Enforce Immutability: block modifications if completed
    if (test.completedAt) {
      throw new AppError("Test is already completed and graded. History is immutable.", 400);
    }

    let totalQuestions = test.results.length;
    let correctAnswers = 0;
    let totalScore = 0;
    let maxScore = 0;

    const categoryTotals: Record<string, { correct: number; total: number }> = {};
    const difficultyTotals: Record<string, { correct: number; total: number }> = {};

    // Grouping questions for stats increment
    const correctQuestionIds: string[] = [];
    const incorrectQuestionIds: string[] = [];

    for (const result of test.results) {
      const q = result.question;
      const weight = DIFFICULTY_WEIGHTS[q.difficulty] ?? 1;

      maxScore += weight;
      if (result.isCorrect) {
        correctAnswers += 1;
        totalScore += weight;
        correctQuestionIds.push(q.id);
      } else {
        incorrectQuestionIds.push(q.id);
      }

      // Track categories
      const cat = q.category;
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { correct: 0, total: 0 };
      }
      categoryTotals[cat].total += weight;
      if (result.isCorrect) {
        categoryTotals[cat].correct += weight;
      }

      // Track difficulty
      const diff = q.difficulty.toLowerCase();
      if (!difficultyTotals[diff]) {
        difficultyTotals[diff] = { correct: 0, total: 0 };
      }
      difficultyTotals[diff].total += weight;
      if (result.isCorrect) {
        difficultyTotals[diff].correct += weight;
      }
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const verdict = percentage >= test.passPercentage ? "PASS" : "FAIL";

    const categoryScores: Record<string, number> = {};
    for (const [cat, data] of Object.entries(categoryTotals)) {
      categoryScores[cat] = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    }

    // Compile analytics json object
    const difficultyAccuracy: Record<string, number> = {};
    for (const [diff, data] of Object.entries(difficultyTotals)) {
      difficultyAccuracy[diff] = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    }

    const durationSeconds = test.startedAt
      ? Math.round((new Date().getTime() - test.startedAt.getTime()) / 1000)
      : 0;

    const analytics = {
      difficultyAccuracy,
      durationSeconds,
      categoryAccuracy: categoryTotals,
    };

    // Calculate recommendations
    const weakCategories = Object.entries(categoryScores)
      .filter(([_, score]) => score < 60)
      .map(([cat]) => cat);

    const recommendedTopics: string[] = [];
    const suggestedMaterials: string[] = [];

    for (const cat of weakCategories) {
      recommendedTopics.push(`Core concepts in ${cat}`);
      suggestedMaterials.push(`Recommend review of ${cat} Question bank training exercises`);
    }

    const recommendations = {
      weakCategories,
      recommendedTopics,
      suggestedMaterials,
    };

    return prisma.$transaction(async (tx) => {
      // 1. Update test
      const updated = await tx.assessmentTest.update({
        where: { id },
        data: {
          completedAt: new Date(),
          correctAnswers,
          totalQuestions,
          totalScore,
          maxScore,
          percentage,
          categoryScores: categoryScores as any,
          verdict,
          analytics: analytics as any,
          recommendations: recommendations as any,
        },
        include: TEST_INCLUDE,
      });

      // 2. Increment Question attempts counters in batch
      if (correctQuestionIds.length > 0) {
        await tx.assessmentQuestion.updateMany({
          where: { id: { in: correctQuestionIds } },
          data: {
            totalAttempts: { increment: 1 },
            correctAttempts: { increment: 1 },
          },
        });
      }

      if (incorrectQuestionIds.length > 0) {
        await tx.assessmentQuestion.updateMany({
          where: { id: { in: incorrectQuestionIds } },
          data: {
            totalAttempts: { increment: 1 },
          },
        });
      }

      return updated;
    });
  },

  // ── Metrics & Analytics ────────────────────────────────────────────────────

  async getMetrics(tenantId: string) {
    const [total, passed, failed, started] = await Promise.all([
      prisma.assessmentTest.count({ where: { tenantId } }),
      prisma.assessmentTest.count({ where: { tenantId, verdict: "PASS" } }),
      prisma.assessmentTest.count({ where: { tenantId, verdict: "FAIL" } }),
      prisma.assessmentTest.count({ where: { tenantId, startedAt: { not: null } } }),
    ]);

    const avgPercentageRaw = await prisma.assessmentTest.aggregate({
      where: { tenantId, completedAt: { not: null } },
      _avg: { percentage: true },
    });

    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return {
      total,
      passed,
      failed,
      started,
      pending: total - (passed + failed),
      passRate,
      averagePercentage: avgPercentageRaw._avg.percentage ?? 0,
    };
  },

  /**
   * Weak question detection: find questions with high fail rate (>90%) or high pass rate (>95%)
   */
  async getWeakQuestions(thresholdFail: number = 0.9, thresholdPass: number = 0.95) {
    const questions = await prisma.assessmentQuestion.findMany({
      where: { totalAttempts: { gt: 5 } },
    });

    const flaggedQuestions = questions.map((q) => {
      const passRate = q.totalAttempts > 0 ? q.correctAttempts / q.totalAttempts : 0;
      const failRate = 1 - passRate;

      return {
        id: q.id,
        questionText: q.questionText,
        category: q.category,
        totalAttempts: q.totalAttempts,
        correctAttempts: q.correctAttempts,
        passRate: Math.round(passRate * 100),
        failRate: Math.round(failRate * 100),
        status: failRate >= thresholdFail ? "TOO_HARD" : passRate >= thresholdPass ? "TOO_EASY" : "BALANCED",
      };
    });

    return flaggedQuestions.filter((q) => q.status !== "BALANCED");
  },
};
