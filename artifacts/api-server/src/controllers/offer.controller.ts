import { Request, Response, NextFunction } from "express";
import { OfferService } from "../services/offer.service";
import { OfferRepository } from "../repositories/offer.repository";
import { CreateOfferSchema, SubmitApprovalDecisionSchema } from "../validators/hiring-decision.validator";
import { AppError } from "../utils/app-error";

export const OfferController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const body = CreateOfferSchema.parse(req.body);
      const offer = await OfferService.createOffer(tenantId, body as any, userId);

      res.status(201).json({ success: true, data: offer });
    } catch (err) { next(err); }
  },

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;
      const offer = await OfferRepository.findById(tenantId, id);

      res.json({ success: true, data: offer });
    } catch (err) { next(err); }
  },

  async findMany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const { pipelineId, status } = req.query as any;
      const offers = await OfferRepository.findMany(tenantId, { pipelineId, status });

      res.json({ success: true, data: offers });
    } catch (err) { next(err); }
  },

  async submitForApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;
      const { approverUserIds } = req.body;

      const offer = await OfferService.submitForApproval(tenantId, id, approverUserIds, userId);

      res.json({ success: true, data: offer });
    } catch (err) { next(err); }
  },

  async submitApprovalDecision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;
      const body = SubmitApprovalDecisionSchema.parse(req.body);

      const offer = await OfferService.submitApprovalDecision(
        tenantId,
        id,
        userId,
        body.status,
        body.comments,
        userId
      );

      res.json({ success: true, data: offer });
    } catch (err) { next(err); }
  },

  async release(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;

      const offer = await OfferService.releaseOffer(tenantId, id, userId);

      res.json({ success: true, data: offer });
    } catch (err) { next(err); }
  },

  async accept(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;

      const offer = await OfferService.acceptOffer(tenantId, id, userId);

      res.json({ success: true, data: offer });
    } catch (err) { next(err); }
  },

  async decline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;
      const { reason } = req.body;

      const offer = await OfferService.declineOffer(tenantId, id, reason, userId);

      res.json({ success: true, data: offer });
    } catch (err) { next(err); }
  },

  async revoke(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;
      const { reason } = req.body;

      const offer = await OfferService.revokeOffer(tenantId, id, reason, userId);

      res.json({ success: true, data: offer });
    } catch (err) { next(err); }
  },
};
