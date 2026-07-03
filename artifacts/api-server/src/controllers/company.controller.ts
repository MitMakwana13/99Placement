import { Request, Response, NextFunction } from "express";
import { CompanyService } from "../services/company.service";
import { CompanyRepository } from "../repositories/company.repository";
import {
  CreateCompanySchema,
  UpdateCompanySchema,
  QueryCompanySchema,
  MergeCompaniesSchema,
  AddContactSchema,
  UpdateContactSchema,
  AddDepartmentSchema,
  AddDocumentSchema,
  CompanyAddNoteSchema,
  AssignRecruiterSchema,
  CompanySaveFilterSchema,
} from "../validators/company.validator";
import { sendSuccess, sendCreated } from "../utils/response";
import { AppError } from "../utils/app-error";

export class CompanyController {

  // ── Core CRUD ──────────────────────────────────────────────────────────────

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const body = CreateCompanySchema.parse(req.body);
      const company = await CompanyService.createCompany(tenantId, body as any, userId);
      sendCreated(res, company);
    } catch (err) { next(err); }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const company = await CompanyRepository.findById(tenantId, id, true);
      if (!company) throw AppError.notFound("Company not found.");
      sendSuccess(res, company);
    } catch (err) { next(err); }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const { limit, cursor, sortBy, sortOrder, ...filters } = QueryCompanySchema.parse(req.query);
      const result = await CompanyRepository.findManyPaginated(tenantId, filters, { limit, cursor, sortBy, sortOrder });
      sendSuccess(res, result);
    } catch (err) { next(err); }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const body = UpdateCompanySchema.parse(req.body);
      const company = await CompanyService.updateCompany(tenantId, id, body as any, userId);
      sendSuccess(res, company);
    } catch (err) { next(err); }
  }

  // ── Archive / Restore / Delete ─────────────────────────────────────────────

  static async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const company = await CompanyService.archiveCompany(tenantId, id, userId);
      sendSuccess(res, company);
    } catch (err) { next(err); }
  }

  static async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const company = await CompanyService.restoreCompany(tenantId, id, userId);
      sendSuccess(res, company);
    } catch (err) { next(err); }
  }

  static async permanentDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      await CompanyService.permanentDeleteCompany(tenantId, id);
      sendSuccess(res, { message: "Company permanently deleted." });
    } catch (err) { next(err); }
  }

  // ── Merge ──────────────────────────────────────────────────────────────────

  static async merge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const { sourceCompanyId, targetCompanyId } = MergeCompaniesSchema.parse(req.body);
      const merged = await CompanyService.mergeCompanies(tenantId, sourceCompanyId, targetCompanyId, userId);
      sendSuccess(res, merged);
    } catch (err) { next(err); }
  }

  // ── Recruiter Assignment ───────────────────────────────────────────────────

  static async assignRecruiter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const { userId: recruiterId, isLead } = AssignRecruiterSchema.parse(req.body);
      const assignment = await CompanyService.assignRecruiter(tenantId, id, recruiterId, isLead, userId);
      sendCreated(res, assignment);
    } catch (err) { next(err); }
  }

  static async removeRecruiter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const recruiterId = req.params.userId as string;
      await CompanyService.removeRecruiter(tenantId, id, recruiterId);
      sendSuccess(res, { message: "Recruiter removed from company." });
    } catch (err) { next(err); }
  }

  // ── Contacts ──────────────────────────────────────────────────────────────

  static async addContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const body = AddContactSchema.parse(req.body);
      const contact = await CompanyService.addContact(tenantId, id, body as any, userId);
      sendCreated(res, contact);
    } catch (err) { next(err); }
  }

  static async updateContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const contactId = req.params.contactId as string;
      const body = UpdateContactSchema.parse(req.body);
      const contact = await CompanyService.updateContact(tenantId, id, contactId, body);
      sendSuccess(res, contact);
    } catch (err) { next(err); }
  }

  static async removeContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const contactId = req.params.contactId as string;
      await CompanyService.removeContact(tenantId, id, contactId);
      sendSuccess(res, { message: "Contact removed." });
    } catch (err) { next(err); }
  }

  static async getContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const contacts = await CompanyService.getContacts(tenantId, id);
      sendSuccess(res, contacts);
    } catch (err) { next(err); }
  }

  // ── Notes ─────────────────────────────────────────────────────────────────

  static async addNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const { content, isPrivate } = CompanyAddNoteSchema.parse(req.body);
      const note = await CompanyService.addNote(tenantId, id, content, isPrivate, userId);
      sendCreated(res, note);
    } catch (err) { next(err); }
  }

  static async getNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const notes = await CompanyService.getNotes(tenantId, id);
      sendSuccess(res, notes);
    } catch (err) { next(err); }
  }

  // ── Documents ─────────────────────────────────────────────────────────────

  static async addDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const body = AddDocumentSchema.parse(req.body);
      const doc = await CompanyService.addDocument(tenantId, id, body as any);
      sendCreated(res, doc);
    } catch (err) { next(err); }
  }

  static async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const docs = await CompanyService.getDocuments(tenantId, id);
      sendSuccess(res, docs);
    } catch (err) { next(err); }
  }

  // ── Departments ────────────────────────────────────────────────────────────

  static async addDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const body = AddDepartmentSchema.parse(req.body);
      const dept = await CompanyService.addDepartment(tenantId, id, body as any);
      sendCreated(res, dept);
    } catch (err) { next(err); }
  }

  static async getDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const depts = await CompanyService.getDepartments(tenantId, id);
      sendSuccess(res, depts);
    } catch (err) { next(err); }
  }

  // ── Timeline ──────────────────────────────────────────────────────────────

  static async getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId } = req.context;
      if (!tenantId) throw AppError.unauthorized("Tenant context missing.");
      const id = req.params.id as string;
      const timeline = await CompanyService.getTimeline(tenantId, id);
      sendSuccess(res, timeline);
    } catch (err) { next(err); }
  }

  // ── Saved Filters ─────────────────────────────────────────────────────────

  static async saveFilter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId || !userId) throw AppError.unauthorized("Auth context missing.");
      const { name, filters } = CompanySaveFilterSchema.parse(req.body);
      const saved = await CompanyService.saveFilter(tenantId, userId, name, filters);
      sendCreated(res, saved);
    } catch (err) { next(err); }
  }

  static async getFilters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, userId } = req.context;
      if (!tenantId || !userId) throw AppError.unauthorized("Auth context missing.");
      const filters = await CompanyService.getFilters(tenantId, userId);
      sendSuccess(res, filters);
    } catch (err) { next(err); }
  }
}
