import { Request, Response, NextFunction } from "express";
import { AssessmentService } from "../services/assessment.service";
import { AssessmentRepository } from "../repositories/assessment.repository";
import {
  CreateQuestionSchema,
  UpdateQuestionSchema,
  CreateTemplateSchema,
  UpdateTemplateSchema,
  AssignTestSchema,
  SubmitAnswerSchema,
} from "../validators/assessment.validator";
import { sendSuccess, sendCreated } from "../utils/response";
import { AppError } from "../utils/app-error";

export const AssessmentController = {
  // ── Template Management ───────────────────────────────────────────────────

  async createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const body = CreateTemplateSchema.parse(req.body);
      const template = await AssessmentService.createTemplate(tenantId, body as any, userId);
      sendCreated(res, template);
    } catch (err) { next(err); }
  },

  async getTemplateById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const id = req.params.id as string;
      const template = await AssessmentService.findTemplateById(tenantId, id);
      sendSuccess(res, template);
    } catch (err) { next(err); }
  },

  async updateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const id = req.params.id as string;
      const body = UpdateTemplateSchema.parse(req.body);
      const template = await AssessmentService.updateTemplate(tenantId, id, body as any, userId);
      sendSuccess(res, template);
    } catch (err) { next(err); }
  },

  async deleteTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const id = req.params.id as string;
      await AssessmentService.deleteTemplate(tenantId, id, userId);
      sendSuccess(res, { success: true });
    } catch (err) { next(err); }
  },

  async listTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const templates = await AssessmentService.listTemplates(tenantId);
      sendSuccess(res, templates);
    } catch (err) { next(err); }
  },

  // ── Question Bank ─────────────────────────────────────────────────────────

  async createQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = CreateQuestionSchema.parse(req.body);
      const question = await AssessmentRepository.createQuestion(body as any);
      sendCreated(res, question);
    } catch (err) { next(err); }
  },

  async getQuestionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const question = await AssessmentRepository.findQuestionById(id);
      sendSuccess(res, question);
    } catch (err) { next(err); }
  },

  async updateQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const body = UpdateQuestionSchema.parse(req.body);
      const question = await AssessmentRepository.updateQuestion(id, body);
      sendSuccess(res, question);
    } catch (err) { next(err); }
  },

  async deleteQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await AssessmentRepository.deleteQuestion(id);
      sendSuccess(res, { success: true });
    } catch (err) { next(err); }
  },

  async listQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, difficulty, isActive, page, pageSize } = req.query as any;
      const result = await AssessmentRepository.listQuestions(
        {
          category,
          difficulty,
          isActive: isActive !== undefined ? isActive === "true" : undefined,
        },
        {
          page: page ? parseInt(page) : 1,
          pageSize: pageSize ? parseInt(pageSize) : 20,
        }
      );
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async getWeakQuestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { thresholdFail, thresholdPass } = req.query as any;
      const result = await AssessmentService.getWeakQuestions(
        thresholdFail ? parseFloat(thresholdFail) : undefined,
        thresholdPass ? parseFloat(thresholdPass) : undefined
      );
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  // ── Assessment Test Actions ────────────────────────────────────────────────

  async assignTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const body = AssignTestSchema.parse(req.body);
      const test = await AssessmentService.assignTest(tenantId, body as any, userId);
      sendCreated(res, test);
    } catch (err) { next(err); }
  },

  async getTestById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const id = req.params.id as string;
      const test = await AssessmentService.findTestById(tenantId, id);
      sendSuccess(res, test);
    } catch (err) { next(err); }
  },

  async getTestForCandidate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const id = req.params.id as string;
      const test = await AssessmentService.findTestForCandidate(tenantId, id);
      sendSuccess(res, test);
    } catch (err) { next(err); }
  },

  async getDetailedReportCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const id = req.params.id as string;
      const report = await AssessmentService.getDetailedReportCard(tenantId, id);
      sendSuccess(res, report);
    } catch (err) { next(err); }
  },

  async startTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const id = req.params.id as string;
      const test = await AssessmentService.startTest(tenantId, id, userId);
      sendSuccess(res, test);
    } catch (err) { next(err); }
  },

  async submitAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const id = req.params.id as string;
      const body = SubmitAnswerSchema.parse(req.body);

      const result = await AssessmentService.submitAnswer(tenantId, id, body.questionId, body.selectedOption);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async completeTest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const id = req.params.id as string;
      const test = await AssessmentService.completeTest(tenantId, id, userId);
      sendSuccess(res, test);
    } catch (err) { next(err); }
  },

  async listTests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const { pipelineId, verdict, page, pageSize } = req.query as any;
      const result = await AssessmentService.listTests(
        tenantId,
        { pipelineId, verdict },
        {
          page: page ? parseInt(page) : 1,
          pageSize: pageSize ? parseInt(pageSize) : 20,
        }
      );
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const metrics = await AssessmentService.getMetrics(tenantId);
      sendSuccess(res, metrics);
    } catch (err) { next(err); }
  },
};
