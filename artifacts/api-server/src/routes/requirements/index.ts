import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { requirementsTable, companiesTable, candidatePipelineTable } from "@workspace/db/schema";
import { eq, and, isNull, ilike, sql } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

const router: IRouter = Router();

router.get("/requirements", requireAuth, async (req, res): Promise<void> => {
  const { status, urgency, companyId, search, limit = "50", offset = "0" } = req.query;

  const conditions = [isNull(requirementsTable.deletedAt)];
  if (status && typeof status === "string") conditions.push(eq(requirementsTable.status, status as any));
  if (urgency && typeof urgency === "string") conditions.push(eq(requirementsTable.urgency, urgency as any));
  if (companyId && typeof companyId === "string") conditions.push(eq(requirementsTable.companyId, companyId));
  if (search && typeof search === "string") conditions.push(ilike(requirementsTable.title, `%${search}%`));

  const rows = await db
    .select({
      id: requirementsTable.id,
      companyId: requirementsTable.companyId,
      recruiterId: requirementsTable.recruiterId,
      title: requirementsTable.title,
      location: requirementsTable.location,
      jobType: requirementsTable.jobType,
      urgency: requirementsTable.urgency,
      salaryBand: requirementsTable.salaryBand,
      jdText: requirementsTable.jdText,
      openingsCount: requirementsTable.openingsCount,
      status: requirementsTable.status,
      deadline: requirementsTable.deadline,
      createdAt: requirementsTable.createdAt,
      updatedAt: requirementsTable.updatedAt,
      company: {
        id: companiesTable.id,
        name: companiesTable.name,
        industry: companiesTable.industry,
        website: companiesTable.website,
        gstin: companiesTable.gstin,
        isActive: companiesTable.isActive,
        createdAt: companiesTable.createdAt,
      },
    })
    .from(requirementsTable)
    .leftJoin(companiesTable, eq(requirementsTable.companyId, companiesTable.id))
    .where(and(...conditions))
    .limit(Number(limit))
    .offset(Number(offset));

  res.json(rows.map(r => ({ ...r, stageCounts: {} })));
});

router.post("/requirements", requireAuth, async (req, res): Promise<void> => {
  const { tenantId } = req.context;
  const { companyId, title, location, jobType, urgency, salaryBand, jdText, openingsCount, status, deadline, recruiterId } = req.body;
  if (!companyId || !title || !location) {
    res.status(400).json({ error: "companyId, title and location are required" });
    return;
  }

  const [req2] = await db
    .insert(requirementsTable)
    .values({
      tenantId,
      companyId, title, location,
      jobType: jobType || "full_time",
      urgency: urgency || "normal",
      salaryBand, jdText,
      openingsCount: openingsCount || 1,
      status: status || "open",
      deadline: deadline ? new Date(deadline) : undefined,
      recruiterId: recruiterId || req.employee?.employeeId,
    })
    .returning();

  res.status(201).json(req2);
});

router.get("/requirements/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [row] = await db
    .select({
      id: requirementsTable.id,
      companyId: requirementsTable.companyId,
      recruiterId: requirementsTable.recruiterId,
      title: requirementsTable.title,
      location: requirementsTable.location,
      jobType: requirementsTable.jobType,
      urgency: requirementsTable.urgency,
      salaryBand: requirementsTable.salaryBand,
      jdText: requirementsTable.jdText,
      openingsCount: requirementsTable.openingsCount,
      status: requirementsTable.status,
      deadline: requirementsTable.deadline,
      createdAt: requirementsTable.createdAt,
      updatedAt: requirementsTable.updatedAt,
      company: {
        id: companiesTable.id,
        name: companiesTable.name,
        industry: companiesTable.industry,
        website: companiesTable.website,
        gstin: companiesTable.gstin,
        isActive: companiesTable.isActive,
        createdAt: companiesTable.createdAt,
      },
    })
    .from(requirementsTable)
    .leftJoin(companiesTable, eq(requirementsTable.companyId, companiesTable.id))
    .where(and(eq(requirementsTable.id, id), isNull(requirementsTable.deletedAt)));

  if (!row) {
    res.status(404).json({ error: "Requirement not found" });
    return;
  }

  // Get stage counts
  const stageCounts = await db
    .select({ stage: candidatePipelineTable.stage, count: sql<number>`count(*)::int` })
    .from(candidatePipelineTable)
    .where(eq(candidatePipelineTable.requirementId, id))
    .groupBy(candidatePipelineTable.stage);

  const stageCountMap: Record<string, number> = {};
  stageCounts.forEach(s => { stageCountMap[s.stage] = s.count; });

  res.json({ ...row, stageCounts: stageCountMap });
});

router.patch("/requirements/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { title, location, jobType, urgency, salaryBand, jdText, openingsCount, status, deadline } = req.body;

  const [updated] = await db
    .update(requirementsTable)
    .set({ title, location, jobType, urgency, salaryBand, jdText, openingsCount, status, deadline: deadline ? new Date(deadline) : undefined, updatedAt: new Date() })
    .where(and(eq(requirementsTable.id, id), isNull(requirementsTable.deletedAt)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(updated);
});

router.delete("/requirements/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  await db
    .update(requirementsTable)
    .set({ deletedAt: new Date() })
    .where(eq(requirementsTable.id, id));

  res.sendStatus(204);
});

export default router;
