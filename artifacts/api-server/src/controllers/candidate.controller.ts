import { Request, Response, NextFunction } from "express";
import { CandidateService } from "../services/candidate.service";
import { CandidateRepository } from "../repositories/candidate.repository";
import { CreateCandidateSchema, UpdateCandidateSchema, QueryCandidateSchema, MergeCandidatesSchema, SaveFilterSchema, AddNoteSchema, DocumentSchema } from "../validators/candidate.validator";
import { sendSuccess, sendCreated } from "../utils/response";
import { AppError } from "../utils/app-error";
import { prisma } from "@workspace/db-prisma";
import { eventBus } from "../utils/event-bus";

export class CandidateController {
  /**
   * Create Candidate Profile
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context.tenantId;
      const performedById = req.context.userId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const body = CreateCandidateSchema.parse(req.body);
      const candidate = await CandidateService.createCandidate(tenantId, body as any, performedById);
      
      // Trigger CandidateCreated workflow event
      import("../services/workflow.service").then(({ WorkflowEngine }) => {
        WorkflowEngine.triggerEvent(tenantId, "CandidateCreated", { 
          candidateId: candidate.id, 
          email: candidate.email, 
          phone: candidate.phone, 
          name: candidate.name 
        });
      });

      sendCreated(res, candidate);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update Candidate Profile
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context.tenantId;
      const performedById = req.context.userId;
      const id = req.params.id as string;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const body = UpdateCandidateSchema.parse(req.body);
      const candidate = await CandidateService.updateCandidate(tenantId, id, body as any, performedById);
      sendSuccess(res, candidate);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieve Candidate by ID
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context.tenantId;
      const id = req.params.id as string;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const candidate = await CandidateService.getCandidateById(tenantId, id);
      if (!candidate) {
        throw AppError.notFound("Candidate not found.");
      }
      sendSuccess(res, candidate);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Query candidates with advanced filters and cursor pagination
   */
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context.tenantId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      // Parse query params using schema validator
      const query = QueryCandidateSchema.parse(req.query);

      const filters = {
        search: query.search,
        name: query.name,
        email: query.email,
        phone: query.phone,
        skills: query.skills,
        minExperience: query.minExperience,
        maxExperience: query.maxExperience,
        currentCompany: query.currentCompany,
        minCurrentCtc: query.minCurrentCtc,
        maxCurrentCtc: query.maxCurrentCtc,
        minExpectedCtc: query.minExpectedCtc,
        maxExpectedCtc: query.maxExpectedCtc,
        maxNoticeDays: query.maxNoticeDays,
        location: query.location,
        status: query.status,
        source: query.source,
        tags: query.tags,
        recruiterId: query.recruiterId,
        createdFrom: query.createdFrom,
        createdTo: query.createdTo,
      };

      const pagination = {
        limit: query.limit,
        cursor: query.cursor,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      };

      const results = await CandidateService.queryCandidates(tenantId, filters, pagination);
      sendSuccess(res, results);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Soft Delete Candidate Profile
   */
  static async softDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context.tenantId;
      const performedById = req.context.userId;
      const id = req.params.id as string;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      await CandidateService.softDeleteCandidate(tenantId, id, performedById);
      sendSuccess(res, { message: "Candidate profile soft deleted successfully." });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Restore soft-deleted Candidate Profile
   */
  static async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context.tenantId;
      const performedById = req.context.userId;
      const id = req.params.id as string;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const restored = await CandidateService.restoreCandidate(tenantId, id, performedById);
      sendSuccess(res, restored);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Permanent Delete Candidate Profile
   */
  static async permanentDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context.tenantId;
      const id = req.params.id as string;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      await CandidateService.permanentDeleteCandidate(tenantId, id);
      sendSuccess(res, { message: "Candidate profile permanently removed." });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Merge Source Candidate duplicate into Target Candidate
   */
  static async merge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context.tenantId;
      const performedById = req.context.userId;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const body = MergeCandidatesSchema.parse(req.body);
      const merged = await CandidateService.mergeCandidates(tenantId, body.sourceCandidateId, body.targetCandidateId, performedById);
      sendSuccess(res, merged);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Add note to a Candidate
   */
  static async addNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context.tenantId;
      const authorId = req.context.userId;
      const candidateId = req.params.id as string;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const body = AddNoteSchema.parse(req.body);
      const note = await prisma.candidateNote.create({
        data: {
          tenantId,
          candidateId,
          authorId,
          content: body.content,
          isPrivate: body.isPrivate,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Emit note created timeline entry
      await prisma.candidateTimeline.create({
        data: {
          tenantId,
          candidateId,
          eventType: "NoteAdded",
          title: "Note Added",
          description: body.isPrivate ? "A private note was added." : `Note: "${body.content.slice(0, 50)}..."`,
          performedById: authorId,
        },
      });

      sendCreated(res, note);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Fetch Notes for a Candidate
   */
  static async getNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context.tenantId;
      const candidateId = req.params.id as string;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const notes = await prisma.candidateNote.findMany({
        where: { tenantId, candidateId },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      sendSuccess(res, notes);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Upload Document for Candidate
   */
  static async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context.tenantId;
      const performedById = req.context.userId;
      const candidateId = req.params.id as string;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const docInput = DocumentSchema.parse(req.body);
      const document = await prisma.candidateDocument.create({
        data: {
          tenantId,
          candidateId,
          name: docInput.name,
          documentType: docInput.documentType,
          fileUrl: docInput.fileUrl,
          fileKey: docInput.fileKey,
          fileSize: docInput.fileSize,
          checksum: docInput.checksum,
        },
      });

      // Append Timeline Log
      await prisma.candidateTimeline.create({
        data: {
          tenantId,
          candidateId,
          eventType: "DocumentAdded",
          title: `Document Uploaded: ${docInput.name}`,
          description: `Attached document type: ${docInput.documentType}`,
          performedById,
        },
      });

      sendCreated(res, document);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieve timeline log history for a Candidate
   */
  static async getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context.tenantId;
      const candidateId = req.params.id as string;
      if (!tenantId) {
        throw AppError.unauthorized("Tenant isolation context missing.");
      }

      const timeline = await prisma.candidateTimeline.findMany({
        where: { tenantId, candidateId },
        include: {
          performedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      sendSuccess(res, timeline);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Save filter search configs
   */
  static async saveSearchFilter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context.tenantId;
      const userId = req.context.userId;
      if (!tenantId || !userId) {
        throw AppError.unauthorized("Authentication required to save filters.");
      }

      const body = SaveFilterSchema.parse(req.body);
      const saved = await CandidateRepository.saveFilter(tenantId, userId, body.name, body.filters);
      sendCreated(res, saved);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all saved filters
   */
  static async getSavedSearchFilters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.context.tenantId;
      const userId = req.context.userId;
      if (!tenantId || !userId) {
        throw AppError.unauthorized("Authentication required to retrieve saved filters.");
      }

      const savedFilters = await CandidateService.getSavedFilters(tenantId, userId);
      sendSuccess(res, savedFilters);
    } catch (err) {
      next(err);
    }
  }
}
