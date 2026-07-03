/**
 * Assessment Service
 *
 * Implements business rules for the 99 Placement Assessment & Scorecard Engine.
 */

import { domainEventBus } from "../events/event-bus";
import { AssessmentRepository } from "../repositories/assessment.repository";
import { PipelineRepository } from "../repositories/pipeline.repository";
import { AppError } from "../utils/app-error";
import { prisma } from "@workspace/db-prisma";
import logger from "../../src/lib/logger";
import { redisCache } from "../config/redis";
import {
  AssessmentAssignedEvent,
  AssessmentStartedEvent,
  AssessmentSubmittedEvent,
  AssessmentEvaluatedEvent,
} from "../events/assessment/assessment.events";
import { CreateTemplateSchema, UpdateTemplateSchema } from "../validators/assessment.validator";

export interface AssignTestInput {
  pipelineId: string;
  templateId?: string; // Reusable template ID
  conductedById?: string;
  passPercentage?: number;
  durationMinutes?: number;
  scheduledAt?: Date;
  questionIds?: string[];
  randomSelection?: {
    categories: Record<string, number>; // e.g. { APTITUDE: 5, ENGLISH: 3 }
    difficulty?: string;
  };
}

export const AssessmentService = {
  // ── Template Management ───────────────────────────────────────────────────

  async createTemplate(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      passPercentage: number;
      durationMinutes: number;
      randomizationRules?: any;
    },
    performedById: string,
  ) {
    const parsed = CreateTemplateSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError("Validation failed: " + parsed.error.message, 400);
    }
    return AssessmentRepository.createTemplate(tenantId, parsed.data as any);
  },

  async findTemplateById(tenantId: string, id: string) {
    const cacheKey = `template:${tenantId}:${id}`;
    try {
      const cached = await redisCache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached, (key, value) => {
          if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            return new Date(value);
          }
          return value;
        });
      }
    } catch (err: any) {
      logger.warn(`Failed reading template cache: ${err.message}`);
    }

    const template = await AssessmentRepository.findTemplateById(tenantId, id);
    if (template) {
      try {
        await redisCache.set(cacheKey, JSON.stringify(template), 3600);
      } catch (err: any) {
        logger.warn(`Failed writing template to cache: ${err.message}`);
      }
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
    performedById: string,
  ) {
    const parsed = UpdateTemplateSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError("Validation failed: " + parsed.error.message, 400);
    }
    const updated = await AssessmentRepository.updateTemplate(tenantId, id, parsed.data);
    try {
      await redisCache.del(`template:${tenantId}:${id}`);
    } catch (err: any) {
      logger.warn(`Failed evicting template cache: ${err.message}`);
    }
    return updated;
  },

  async deleteTemplate(tenantId: string, id: string, performedById: string) {
    const deleted = await AssessmentRepository.deleteTemplate(tenantId, id);
    try {
      await redisCache.del(`template:${tenantId}:${id}`);
    } catch (err: any) {
      logger.warn(`Failed evicting template cache: ${err.message}`);
    }
    return deleted;
  },

  async listTemplates(tenantId: string) {
    return AssessmentRepository.listTemplates(tenantId);
  },

  // ── Question Bank Versioning ──────────────────────────────────────────────

  async createQuestion(data: {
    category: any;
    questionText: string;
    options: string[];
    correctOption: number;
    difficulty?: string;
    isActive?: boolean;
  }) {
    return AssessmentRepository.createQuestion(data);
  },

  async findQuestionById(id: string) {
    const cacheKey = `question:${id}`;
    try {
      const cached = await redisCache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached, (key, value) => {
          if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            return new Date(value);
          }
          return value;
        });
      }
    } catch (err: any) {
      logger.warn(`Failed reading question cache: ${err.message}`);
    }

    const question = await AssessmentRepository.findQuestionById(id);
    if (question) {
      try {
        await redisCache.set(cacheKey, JSON.stringify(question), 3600);
      } catch (err: any) {
        logger.warn(`Failed writing question to cache: ${err.message}`);
      }
    }
    return question;
  },

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
    const updated = await AssessmentRepository.updateQuestion(id, data);
    try {
      await redisCache.del(`question:${id}`);
    } catch (err: any) {
      logger.warn(`Failed evicting question cache: ${err.message}`);
    }
    return updated;
  },

  async deleteQuestion(id: string) {
    const deleted = await AssessmentRepository.deleteQuestion(id);
    try {
      await redisCache.del(`question:${id}`);
    } catch (err: any) {
      logger.warn(`Failed evicting question cache: ${err.message}`);
    }
    return deleted;
  },

  async listQuestions(
    filters: {
      category?: any;
      difficulty?: string;
      isActive?: boolean;
    },
    options: { page?: number; pageSize?: number } = {},
  ) {
    return AssessmentRepository.listQuestions(filters, options);
  },

  // ── Assessment Test Assignment & Grading ───────────────────────────────────

  /**
   * Assign a test. Can use a reusable template or custom configuration.
   */
  async assignTest(tenantId: string, input: AssignTestInput, performedById: string) {
    // 1. Validate pipeline stage
    const pipeline = await PipelineRepository.findById(tenantId, input.pipelineId);
    const validStages = ["ASSESSED", "SHORTLISTED"];
    if (!validStages.includes(pipeline.stage)) {
      throw new AppError(
        `Candidate must be in ASSESSED stage to assign a test. Current stage: ${pipeline.stage}`,
        400,
      );
    }

    let finalPassPercentage = input.passPercentage ?? 50;
    let finalDurationMinutes = input.durationMinutes ?? 45;
    let finalQuestionIds = input.questionIds ?? [];
    let finalRandomSelection = input.randomSelection;

    // 2. Override configurations if AssessmentTemplate is specified
    if (input.templateId) {
      const template = await AssessmentRepository.findTemplateById(tenantId, input.templateId);
      finalPassPercentage = template.passPercentage;
      finalDurationMinutes = template.durationMinutes;

      // Extract template randomization rules
      if (template.randomizationRules && typeof template.randomizationRules === "object") {
        const rules = template.randomizationRules as any;
        if (rules.categories) {
          finalRandomSelection = {
            categories: rules.categories,
            difficulty: rules.difficulty ?? undefined,
          };
        }
      }
    }

    // 3. Question selection logic
    let questionIds: string[] = [];
    if (finalQuestionIds && finalQuestionIds.length > 0) {
      questionIds = finalQuestionIds;
    } else if (finalRandomSelection) {
      const selectedIds: string[] = [];
      for (const [catName, count] of Object.entries(finalRandomSelection.categories)) {
        const candidates = await prisma.assessmentQuestion.findMany({
          where: {
            category: catName as any,
            isActive: true,
            ...(finalRandomSelection.difficulty && { difficulty: finalRandomSelection.difficulty }),
          },
          select: { id: true },
        });

        const shuffled = candidates.sort(() => 0.5 - Math.random());
        const taken = shuffled.slice(0, count).map((q) => q.id);
        selectedIds.push(...taken);
      }
      questionIds = selectedIds;
    }

    if (questionIds.length === 0) {
      throw new AppError(
        "No questions matched your selection. Ensure there are active questions in the Question Bank.",
        400,
      );
    }

    // 4. Save test assignment
    const test = await AssessmentRepository.assignTest(
      tenantId,
      {
        pipelineId: input.pipelineId,
        templateId: input.templateId,
        conductedById: input.conductedById,
        passPercentage: finalPassPercentage,
        durationMinutes: finalDurationMinutes,
        scheduledAt: input.scheduledAt,
      },
      questionIds,
    );

    // 5. Publish Event
    await domainEventBus.publish(
      new AssessmentAssignedEvent(
        tenantId,
        test.id,
        test.pipelineId,
        pipeline.candidateId,
        test.attemptNumber,
        performedById,
      ),
    );

    return test;
  },

  async startTest(tenantId: string, testId: string, performedById: string) {
    const test = await AssessmentRepository.findTestById(tenantId, testId);

    if (test.completedAt) {
      throw new AppError("Cannot start an already completed test.", 400);
    }

    if (test.startedAt) {
      throw new AppError("Test has already been started.", 400);
    }

    const updated = await AssessmentRepository.startTest(tenantId, testId);

    await domainEventBus.publish(
      new AssessmentStartedEvent(
        tenantId,
        testId,
        updated.pipelineId,
        updated.pipeline.candidate.id,
        updated.startedAt!,
        performedById,
      ),
    );

    return updated;
  },

  async submitAnswer(
    tenantId: string,
    testId: string,
    questionId: string,
    selectedOption: number,
  ) {
    // 1. Run auto-submit check if time expired
    const autoSubmitted = await this.checkAndAutoSubmit(tenantId, testId, "SYSTEM");
    if (autoSubmitted) {
      throw new AppError("Time limit has expired for this test.", 400);
    }

    // 2. Log answer
    return AssessmentRepository.submitAnswer(tenantId, testId, questionId, selectedOption);
  },

  async completeTest(tenantId: string, testId: string, performedById: string) {
    const test = await AssessmentRepository.findTestById(tenantId, testId);

    if (test.completedAt) {
      throw new AppError("Test has already been completed.", 400);
    }

    const updated = await AssessmentRepository.completeTest(tenantId, testId);
    const candidateId = updated.pipeline.candidate.id;

    // Publish Submission event
    await domainEventBus.publish(
      new AssessmentSubmittedEvent(
        tenantId,
        testId,
        updated.pipelineId,
        candidateId,
        updated.completedAt!,
        performedById,
      ),
    );

    // Publish Evaluation event
    await domainEventBus.publish(
      new AssessmentEvaluatedEvent(
        tenantId,
        testId,
        updated.pipelineId,
        candidateId,
        updated.totalScore,
        updated.maxScore,
        updated.percentage,
        updated.verdict!,
        performedById,
      ),
    );

    // Advance candidate pipeline stage on PASS
    if (updated.verdict === "PASS") {
      await PipelineRepository.updateStage(tenantId, updated.pipelineId, {
        newStage: "SHORTLISTED",
        reason: `Passed candidate assessment test with ${updated.percentage}% (attempt #${updated.attemptNumber}).`,
        performedById,
      });
    }

    return updated;
  },

  async checkAndAutoSubmit(tenantId: string, testId: string, performedById: string) {
    const test = await prisma.assessmentTest.findFirst({
      where: { id: testId, tenantId },
    });

    if (test && test.startedAt && !test.completedAt) {
      const expirationTime = new Date(test.startedAt.getTime() + test.durationMinutes * 60 * 1000);
      if (new Date() > expirationTime) {
        logger.info(`Auto-submitting expired test: ${testId}`);
        return this.completeTest(tenantId, testId, performedById);
      }
    }
    return null;
  },

  async findTestById(tenantId: string, testId: string, performedById: string = "SYSTEM") {
    await this.checkAndAutoSubmit(tenantId, testId, performedById);
    return AssessmentRepository.findTestById(tenantId, testId);
  },

  async findTestForCandidate(tenantId: string, testId: string) {
    await this.checkAndAutoSubmit(tenantId, testId, "SYSTEM");
    const test = await AssessmentRepository.findTestById(tenantId, testId);

    const isCompleted = test.completedAt !== null;

    return {
      ...test,
      results: test.results.map((r) => {
        const { correctOption, ...safeQuestion } = r.question;
        return {
          ...r,
          question: isCompleted ? r.question : safeQuestion,
        };
      }),
    };
  },

  async listTests(
    tenantId: string,
    filters: { pipelineId?: string; verdict?: string },
    options: { page?: number; pageSize?: number } = {},
  ) {
    return AssessmentRepository.listTests(tenantId, filters, options);
  },

  async getMetrics(tenantId: string) {
    return AssessmentRepository.getMetrics(tenantId);
  },

  async getWeakQuestions(thresholdFail?: number, thresholdPass?: number) {
    return AssessmentRepository.getWeakQuestions(thresholdFail, thresholdPass);
  },

  /**
   * Returns report card summary including analytics, strengths, and recommendations.
   */
  async getDetailedReportCard(tenantId: string, testId: string) {
    await this.checkAndAutoSubmit(tenantId, testId, "SYSTEM");
    const test = await AssessmentRepository.findTestById(tenantId, testId);

    if (!test.completedAt) {
      throw new AppError("Detailed report cards are only available for completed tests.", 400);
    }

    const categoryScores = test.categoryScores as Record<string, number> | null;
    const strengths = categoryScores
      ? Object.entries(categoryScores)
          .filter(([_, score]) => score >= 75)
          .map(([cat]) => cat)
      : [];

    const weaknesses = categoryScores
      ? Object.entries(categoryScores)
          .filter(([_, score]) => score < 60)
          .map(([cat]) => cat)
      : [];

    return {
      testId: test.id,
      candidate: test.pipeline.candidate,
      job: test.pipeline.job,
      verdict: test.verdict,
      percentage: test.percentage,
      attemptNumber: test.attemptNumber,
      completedAt: test.completedAt,
      categoryScores,
      strengths,
      weaknesses,
      analytics: test.analytics,
      recommendations: test.recommendations,
    };
  },
};
