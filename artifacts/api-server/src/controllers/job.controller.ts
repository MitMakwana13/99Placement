import { Request, Response, NextFunction } from "express";
import { JobService } from "../services/job.service";
import { JobRepository } from "../repositories/job.repository";
import {
  CreateJobSchema,
  UpdateJobSchema,
  QueryJobSchema,
  CloseJobSchema,
  CloneJobSchema,
  AssignRecruiterSchema,
  AssignHiringManagerSchema,
  AddJobDocumentSchema,
  JobSaveFilterSchema,
} from "../validators/job.validator";
import { sendSuccess, sendCreated } from "../utils/response";
import { AppError } from "../utils/app-error";

export class JobController {

  // ── Core CRUD ─────────────────────────────────────────────────────────────

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const body = CreateJobSchema.parse(req.body);
      const job  = await JobService.createJob(tenantId, body as any, userId);
      sendCreated(res, job);
    } catch (err) { next(err); }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id  = req.params.id as string;
      const job = await JobRepository.findById(tenantId, id, true);
      if (!job) throw AppError.notFound("Job not found.");
      sendSuccess(res, job);
    } catch (err) { next(err); }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const { limit, cursor, sortBy, sortOrder, ...filters } = QueryJobSchema.parse(req.query);
      const result = await JobRepository.findManyPaginated(tenantId, filters, { limit, cursor, sortBy, sortOrder });
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const id   = req.params.id as string;
      const body = UpdateJobSchema.parse(req.body);
      const job  = await JobService.updateJob(tenantId, id, body as any, userId);
      sendSuccess(res, job);
    } catch (err) { next(err); }
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  static async submitForApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const id  = req.params.id as string;
      const job = await JobService.submitForApproval(tenantId, id, userId);
      sendSuccess(res, job);
    } catch (err) { next(err); }
  }

  static async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const id  = req.params.id as string;
      const job = await JobService.approveJob(tenantId, id, userId);
      sendSuccess(res, job);
    } catch (err) { next(err); }
  }

  static async close(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const id = req.params.id as string;
      const { reason } = CloseJobSchema.parse(req.body);
      const job = await JobService.closeJob(tenantId, id, reason, userId);
      sendSuccess(res, job);
    } catch (err) { next(err); }
  }

  static async reopen(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const id  = req.params.id as string;
      const job = await JobService.reopenJob(tenantId, id, userId);
      sendSuccess(res, job);
    } catch (err) { next(err); }
  }

  static async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const id  = req.params.id as string;
      const job = await JobService.archiveJob(tenantId, id, userId);
      sendSuccess(res, job);
    } catch (err) { next(err); }
  }

  static async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const id  = req.params.id as string;
      const job = await JobService.restoreJob(tenantId, id, userId);
      sendSuccess(res, job);
    } catch (err) { next(err); }
  }

  static async permanentDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      await JobService.permanentDeleteJob(tenantId, id);
      sendSuccess(res, { message: "Job permanently deleted." });
    } catch (err) { next(err); }
  }

  static async clone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const id        = req.params.id as string;
      const overrides = CloneJobSchema.parse(req.body);
      const job       = await JobService.cloneJob(tenantId, id, userId, overrides);
      sendCreated(res, job);
    } catch (err) { next(err); }
  }

  // ── Assignments ───────────────────────────────────────────────────────────────

  static async assignRecruiter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const id = req.params.id as string;
      const { userId: recruiterId, isLead } = AssignRecruiterSchema.parse(req.body);
      const result = await JobService.assignRecruiter(tenantId, id, recruiterId, isLead, userId);
      sendCreated(res, result);
    } catch (err) { next(err); }
  }

  static async removeRecruiter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id          = req.params.id as string;
      const recruiterId = req.params.userId as string;
      await JobService.removeRecruiter(tenantId, id, recruiterId);
      sendSuccess(res, { message: "Recruiter removed from job." });
    } catch (err) { next(err); }
  }

  static async assignHiringManager(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      if (!userId) throw AppError.unauthorized("User context missing.");
      const id = req.params.id as string;
      const { userId: hmId } = AssignHiringManagerSchema.parse(req.body);
      const result = await JobService.assignHiringManager(tenantId, id, hmId, userId);
      sendCreated(res, result);
    } catch (err) { next(err); }
  }

  static async removeHiringManager(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id   = req.params.id as string;
      const hmId = req.params.userId as string;
      await JobService.removeHiringManager(tenantId, id, hmId);
      sendSuccess(res, { message: "Hiring manager removed from job." });
    } catch (err) { next(err); }
  }

  // ── Documents ─────────────────────────────────────────────────────────────────

  static async addDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id   = req.params.id as string;
      const body = AddJobDocumentSchema.parse(req.body);
      const doc  = await JobService.addDocument(tenantId, id, body as any);
      sendCreated(res, doc);
    } catch (err) { next(err); }
  }

  static async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id   = req.params.id as string;
      const docs = await JobService.getDocuments(tenantId, id);
      sendSuccess(res, docs);
    } catch (err) { next(err); }
  }

  // ── Timeline ──────────────────────────────────────────────────────────────────

  static async getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id       = req.params.id as string;
      const timeline = await JobService.getTimeline(tenantId, id);
      sendSuccess(res, timeline);
    } catch (err) { next(err); }
  }

  // ── Metrics ───────────────────────────────────────────────────────────────────

  static async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const metrics = await JobService.getMetrics(tenantId);
      sendSuccess(res, metrics);
    } catch (err) { next(err); }
  }

  // ── Saved Filters ─────────────────────────────────────────────────────────────

  static async saveFilter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId || !userId) throw AppError.unauthorized("Auth context missing.");
      const { name, filters } = JobSaveFilterSchema.parse(req.body);
      const saved = await JobService.saveFilter(tenantId, userId, name, filters);
      sendCreated(res, saved);
    } catch (err) { next(err); }
  }

  static async getFilters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId || !userId) throw AppError.unauthorized("Auth context missing.");
      const filters = await JobService.getFilters(tenantId, userId);
      sendSuccess(res, filters);
    } catch (err) { next(err); }
  }

  // ── Status History ───────────────────────────────────────────────────────────

  static async getStatusHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id      = req.params.id as string;
      const history = await JobRepository.findStatusHistory(tenantId, id);
      sendSuccess(res, history);
    } catch (err) { next(err); }
  }
}
