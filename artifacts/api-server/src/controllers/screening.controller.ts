import { Request, Response, NextFunction } from "express";
import { ScreeningService } from "../services/screening.service";
import { AppError } from "../utils/app-error";

export const ScreeningController = {

  // POST /screenings
  async schedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const { pipelineId, interviewerId, scheduledAt, mode } = req.body;

      const screening = await ScreeningService.scheduleScreening(
        tenantId,
        {
          pipelineId,
          interviewerId: interviewerId ?? userId,
          scheduledAt: new Date(scheduledAt),
          mode,
        },
        userId,
      );

      res.status(201).json({ success: true, data: screening });
    } catch (err) { next(err); }
  },

  // GET /screenings
  async findMany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const { interviewerId, verdict, fromDate, toDate, page, pageSize } = req.query as any;

      const result = await ScreeningService.findMany(
        tenantId,
        {
          interviewerId,
          verdict,
          fromDate: fromDate ? new Date(fromDate) : undefined,
          toDate:   toDate   ? new Date(toDate)   : undefined,
        },
        {
          page:     page     ? parseInt(page)     : 1,
          pageSize: pageSize ? parseInt(pageSize) : 20,
        },
      );

      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  // GET /screenings/metrics
  async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const metrics  = await ScreeningService.getMetrics(tenantId);
      res.json({ success: true, data: metrics });
    } catch (err) { next(err); }
  },

  // GET /screenings/pipeline/:pipelineId
  async findByPipeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const pipelineId = req.params.pipelineId as string;
      const screenings = await ScreeningService.findByPipeline(tenantId, pipelineId);
      res.json({ success: true, data: screenings });
    } catch (err) { next(err); }
  },

  // GET /screenings/:id
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;
      const screening = await ScreeningService.findById(tenantId, id);
      res.json({ success: true, data: screening });
    } catch (err) { next(err); }
  },

  // PATCH /screenings/:id/reschedule
  async reschedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;
      const { scheduledAt, interviewerId, mode } = req.body;

      const updated = await ScreeningService.rescheduleScreening(
        tenantId,
        id,
        { scheduledAt: new Date(scheduledAt), interviewerId, mode },
        userId,
      );

      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  },

  // POST /screenings/:id/scorecard
  async submitScorecard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;

      const updated = await ScreeningService.submitScorecard(tenantId, id, req.body, userId);
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  },

  // PATCH /screenings/:id/cancel
  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId ?? "SYSTEM";
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;
      const { reason } = req.body;

      const cancelled = await ScreeningService.cancelScreening(tenantId, id, reason, userId);
      res.json({ success: true, data: cancelled });
    } catch (err) { next(err); }
  },

  // PATCH /screenings/:id/restore
  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }
      const id = req.params.id as string;
      const restored = await ScreeningService.restoreScreening(tenantId, id);
      res.json({ success: true, data: restored });
    } catch (err) { next(err); }
  },
};
