import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { companiesTable, companyContactsTable } from "@workspace/db/schema";
import { eq, and, isNull, ilike } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

const router: IRouter = Router();

router.get("/companies", requireAuth, async (req, res): Promise<void> => {
  const { search, limit = "50", offset = "0" } = req.query;
  let query = db
    .select()
    .from(companiesTable)
    .where(isNull(companiesTable.deletedAt))
    .$dynamic();

  if (search && typeof search === "string") {
    query = query.where(ilike(companiesTable.name, `%${search}%`));
  }

  const rows = await query.limit(Number(limit)).offset(Number(offset));
  res.json(rows);
});

router.post("/companies", requireAuth, async (req, res): Promise<void> => {
  const { name, industry, website, gstin } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  const tenantId = req.user?.tenantId || "4f019263-832c-45f4-989c-9ca1ddff6bfd";

  const [company] = await db
    .insert(companiesTable)
    .values({ tenantId, name, industry, website, gstin })
    .returning();

  res.status(201).json(company);
});

router.get("/companies/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [company] = await db
    .select()
    .from(companiesTable)
    .where(and(eq(companiesTable.id, id), isNull(companiesTable.deletedAt)));

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }
  res.json(company);
});

router.patch("/companies/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, industry, website, gstin } = req.body;

  const [company] = await db
    .update(companiesTable)
    .set({ name, industry, website, gstin, updatedAt: new Date() })
    .where(and(eq(companiesTable.id, id), isNull(companiesTable.deletedAt)))
    .returning();

  if (!company) {
    res.status(404).json({ error: "Company not found" });
    return;
  }
  res.json(company);
});

router.get("/companies/:id/contacts", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const contacts = await db
    .select()
    .from(companyContactsTable)
    .where(eq(companyContactsTable.companyId, id));
  res.json(contacts);
});

router.post("/companies/:id/contacts", requireAuth, async (req, res): Promise<void> => {
  const companyId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, email, phone, designation, isPrimary } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  const tenantId = req.user?.tenantId || "4f019263-832c-45f4-989c-9ca1ddff6bfd";

  const [contact] = await db
    .insert(companyContactsTable)
    .values({ tenantId, companyId, name, email, phone, designation, isPrimary: !!isPrimary })
    .returning();

  res.status(201).json(contact);
});

export default router;
