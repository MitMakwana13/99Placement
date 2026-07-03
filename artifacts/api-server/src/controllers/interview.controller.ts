import { Request, Response, NextFunction } from "express";
import { InterviewService } from "../services/interview.service";
import { InterviewRepository } from "../repositories/interview.repository";
import { ScheduleInterviewSchema, RescheduleInterviewSchema, SubmitFeedbackSchema } from "../validators/hiring-decision.validator";
import { AppError } from "../utils/app-error";

export const InterviewController = {
  async schedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const body = ScheduleInterviewSchema.parse(req.body);
      const interview = await InterviewService.scheduleInterview(tenantId, body as any, userId);

      res.status(201).json({ success: true, data: interview });
    } catch (err) { next(err); }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;
      const interview = await InterviewRepository.findById(tenantId, id);

      res.json({ success: true, data: interview });
    } catch (err) { next(err); }
  },

  async findMany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const { pipelineId, interviewerId, status } = req.query as any;
      const interviews = await InterviewRepository.findMany(tenantId, { pipelineId, interviewerId, status });

      res.json({ success: true, data: interviews });
    } catch (err) { next(err); }
  },

  async reschedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;
      const body = RescheduleInterviewSchema.parse(req.body);
      const result = await InterviewService.rescheduleInterview(tenantId, id, body as any, userId);

      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;
      const { reason } = req.body;
      if (!reason) {
        throw new AppError("Cancellation reason is required", 400);
      }
      const result = await InterviewService.cancelInterview(tenantId, id, reason, userId);

      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async complete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;
      const result = await InterviewService.markAsCompleted(tenantId, id, userId);

      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async noShow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;
      const result = await InterviewService.markAsNoShow(tenantId, id, userId);

      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;
      const body = SubmitFeedbackSchema.parse(req.body);

      const result = await InterviewService.submitFeedback(
        tenantId,
        id,
        {
          submittedById: userId,
          strengths: body.strengths,
          weaknesses: body.weaknesses,
          comments: body.comments,
          recommendation: body.recommendation,
          overallRating: body.overallRating,
          scores: body.scores as any,
        },
        userId
      );

      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};
