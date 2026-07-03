import { Request, Response, NextFunction } from "express";
import { JoiningService } from "../services/joining.service";
import { CreateJoiningSchema, UpdateJoiningSchema, CreateFollowupSchema } from "../validators/hiring-decision.validator";
import { AppError } from "../utils/app-error";

export const JoiningController = {
  async initiate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const body = CreateJoiningSchema.parse(req.body);
      const result = await JoiningService.initiateJoining(tenantId, body as any, userId);

      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async getRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const pipelineId = req.params.pipelineId as string;
      const result = await JoiningService.getJoiningRecord(tenantId, pipelineId);

      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async updateProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const pipelineId = req.params.pipelineId as string;
      const body = UpdateJoiningSchema.parse(req.body);
      const result = await JoiningService.updateOnboardingProgress(tenantId, pipelineId, body, userId);

      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async markJoined(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const pipelineId = req.params.pipelineId as string;
      const { actualJoinedAt, overridePlannedDate } = req.body;

      if (!actualJoinedAt) {
        throw new AppError("actualJoinedAt is required", 400);
      }

      const result = await JoiningService.markCandidateJoined(
        tenantId,
        pipelineId,
        new Date(actualJoinedAt),
        !!overridePlannedDate,
        userId
      );

      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async markNoShow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const pipelineId = req.params.pipelineId as string;
      const result = await JoiningService.markCandidateNoShow(tenantId, pipelineId, userId);

      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async createFollowup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const body = CreateFollowupSchema.parse(req.body);
      const result = await JoiningService.createPostJoiningFollowup(tenantId, body as any, userId);

      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async getFollowups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const pipelineId = req.params.pipelineId as string;
      const result = await JoiningService.getPostJoiningFollowups(tenantId, pipelineId);

      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};
