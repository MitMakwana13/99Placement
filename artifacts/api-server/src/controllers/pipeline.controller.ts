import { Request, Response, NextFunction } from "express";
import { PipelineService } from "../services/pipeline.service";
import {
  CreatePipelineSchema,
  UpdateStageSchema,
  BulkUpdateStageSchema,
  QueryPipelineSchema,
  PipelineNoteSchema,
  PipelineAttachmentSchema,
  PipelineRatingSchema,
  PipelineChecklistUpdateSchema,
  PipelineReminderSchema,
} from "../validators/pipeline.validator";
import { sendSuccess, sendCreated } from "../utils/response";
import { AppError } from "../utils/app-error";

export class PipelineController {

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const body = CreatePipelineSchema.parse(req.body);
      const result = await PipelineService.create(tenantId, body as any, userId);
      sendCreated(res, result);
    } catch (err) { next(err); }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const result = await PipelineService.findById(tenantId, id);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const { limit, cursor, sortBy, sortOrder, ...filters } = QueryPipelineSchema.parse(req.query);
      const result = await PipelineService.findMany(tenantId, filters, { limit, cursor, sortBy, sortOrder });
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  static async updateStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const id = req.params.id as string;
      const body = UpdateStageSchema.parse(req.body);
      const result = await PipelineService.updateStage(tenantId, id, body as any, userId);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  static async bulkUpdateStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const body = BulkUpdateStageSchema.parse(req.body);
      const result = await PipelineService.bulkUpdateStage(tenantId, body.ids, { newStage: body.newStage, reason: body.reason }, userId);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  static async softDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const id = req.params.id as string;
      const result = await PipelineService.softDelete(tenantId, id, userId);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  static async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const id = req.params.id as string;
      const result = await PipelineService.restore(tenantId, id, userId);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  static async permanentDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const id = req.params.id as string;
      const result = await PipelineService.permanentDelete(tenantId, id, userId);
      sendSuccess(res, { success: result });
    } catch (err) { next(err); }
  }

  // ── Notes CRUD ─────────────────────────────────────────────────────────────

  static async createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const pipelineId = req.params.id as string;
      const body = PipelineNoteSchema.parse(req.body);
      const result = await PipelineService.createNote(tenantId, pipelineId, body as any, userId);
      sendCreated(res, result);
    } catch (err) { next(err); }
  }

  static async deleteNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const noteId = req.params.noteId as string;
      const result = await PipelineService.deleteNote(tenantId, noteId);
      sendSuccess(res, { success: result });
    } catch (err) { next(err); }
  }

  // ── Attachments CRUD ───────────────────────────────────────────────────────

  static async createAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const pipelineId = req.params.id as string;
      const body = PipelineAttachmentSchema.parse(req.body);
      const result = await PipelineService.createAttachment(tenantId, pipelineId, body as any, userId);
      sendCreated(res, result);
    } catch (err) { next(err); }
  }

  static async deleteAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const attachmentId = req.params.attachmentId as string;
      const result = await PipelineService.deleteAttachment(tenantId, attachmentId);
      sendSuccess(res, { success: result });
    } catch (err) { next(err); }
  }

  // ── Ratings Operations ─────────────────────────────────────────────────────

  static async updateRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const pipelineId = req.params.id as string;
      const body = PipelineRatingSchema.parse(req.body);
      const result = await PipelineService.updateRating(tenantId, pipelineId, body, userId);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  // ── Checklist Operations ───────────────────────────────────────────────────

  static async updateChecklistItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const pipelineId = req.params.id as string;
      const itemKey = req.params.itemKey as string;
      const body = PipelineChecklistUpdateSchema.parse(req.body);
      const result = await PipelineService.updateChecklistItem(tenantId, pipelineId, itemKey, body.isCompleted, userId);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  // ── Reminders Operations ───────────────────────────────────────────────────

  static async createReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const pipelineId = req.params.id as string;
      const body = PipelineReminderSchema.parse(req.body);
      const result = await PipelineService.createReminder(tenantId, pipelineId, body as any, userId);
      sendCreated(res, result);
    } catch (err) { next(err); }
  }

  static async updateReminderCompletion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const reminderId = req.params.reminderId as string;
      const body = PipelineChecklistUpdateSchema.parse(req.body);
      const result = await PipelineService.updateReminderCompletion(tenantId, reminderId, body.isCompleted);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  // ── Metrics Operations ─────────────────────────────────────────────────────

  static async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const result = await PipelineService.getPipelineMetrics(tenantId);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

}
