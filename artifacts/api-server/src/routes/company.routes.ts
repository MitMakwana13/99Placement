import { Router } from "express";
import { CompanyController } from "../controllers/company.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/permissions";

const router = Router();

// All company routes require authentication
router.use(requireAuth);

// ── Core ─────────────────────────────────────────────────────────────────────

router.post(
  "/",
  requirePermission("companies:create"),
  CompanyController.create
);

router.get(
  "/",
  requirePermission("companies:read"),
  CompanyController.list
);

router.get(
  "/saved-filters",
  requirePermission("companies:read"),
  CompanyController.getFilters
);

router.post(
  "/saved-filters",
  requirePermission("companies:read"),
  CompanyController.saveFilter
);

router.post(
  "/merge",
  requirePermission("companies:update"),
  CompanyController.merge
);

router.get(
  "/:id",
  requirePermission("companies:read"),
  CompanyController.getById
);

router.put(
  "/:id",
  requirePermission("companies:update"),
  CompanyController.update
);

// ── Archive / Restore / Delete ────────────────────────────────────────────────

router.post(
  "/:id/archive",
  requirePermission("companies:update"),
  CompanyController.archive
);

router.post(
  "/:id/restore",
  requirePermission("companies:update"),
  CompanyController.restore
);

router.delete(
  "/:id/permanent",
  requirePermission("companies:delete"),
  CompanyController.permanentDelete
);

// ── Recruiters ────────────────────────────────────────────────────────────────

router.post(
  "/:id/recruiters",
  requirePermission("companies:update"),
  CompanyController.assignRecruiter
);

router.delete(
  "/:id/recruiters/:userId",
  requirePermission("companies:update"),
  CompanyController.removeRecruiter
);

// ── Contacts ──────────────────────────────────────────────────────────────────

router.get(
  "/:id/contacts",
  requirePermission("companies:read"),
  CompanyController.getContacts
);

router.post(
  "/:id/contacts",
  requirePermission("companies:update"),
  CompanyController.addContact
);

router.put(
  "/:id/contacts/:contactId",
  requirePermission("companies:update"),
  CompanyController.updateContact
);

router.delete(
  "/:id/contacts/:contactId",
  requirePermission("companies:update"),
  CompanyController.removeContact
);

// ── Notes ─────────────────────────────────────────────────────────────────────

router.get(
  "/:id/notes",
  requirePermission("companies:read"),
  CompanyController.getNotes
);

router.post(
  "/:id/notes",
  requirePermission("companies:update"),
  CompanyController.addNote
);

// ── Documents ─────────────────────────────────────────────────────────────────

router.get(
  "/:id/documents",
  requirePermission("companies:read"),
  CompanyController.getDocuments
);

router.post(
  "/:id/documents",
  requirePermission("companies:update"),
  CompanyController.addDocument
);

// ── Departments ───────────────────────────────────────────────────────────────

router.get(
  "/:id/departments",
  requirePermission("companies:read"),
  CompanyController.getDepartments
);

router.post(
  "/:id/departments",
  requirePermission("companies:update"),
  CompanyController.addDepartment
);

// ── Timeline ──────────────────────────────────────────────────────────────────

router.get(
  "/:id/timeline",
  requirePermission("companies:read"),
  CompanyController.getTimeline
);

export default router;
