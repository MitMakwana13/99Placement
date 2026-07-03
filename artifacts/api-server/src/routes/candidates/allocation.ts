/**
 * Candidate Allocation Status Routes — /api/v1/candidates/:id/allocation
 * Tracks granular allocation states: AVAILABLE → BLACKLISTED
 */

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { candidateAllocationStatusTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

const router: IRouter = Router();

const VALID_STATUSES = [
  "AVAILABLE", "ALLOCATED", "INTERVIEW_SCHEDULED", "SELECTED",
  "OFFER_RELEASED", "JOINED", "REJECTED", "ON_HOLD", "BLACKLISTED",
] as const;

// ─── GET /candidates/:id/allocation ────────────────────────────────────────────
router.get("/candidates/:id/allocation", requireAuth, async (req, res): Promise<void> => {
  const candidateId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { tenantId } = req.context;

  const [status] = await db
    .select()
    .from(candidateAllocationStatusTable)
    .where(
      and(
        eq(candidateAllocationStatusTable.candidateId, candidateId),
        eq(candidateAllocationStatusTable.tenantId, tenantId),
      ),
    );

  // Return default AVAILABLE if no record exists yet
  res.json(status ?? { candidateId, status: "AVAILABLE", reason: null });
});

// ─── PATCH /candidates/:id/allocation ──────────────────────────────────────────
router.patch("/candidates/:id/allocation", requireAuth, async (req, res): Promise<void> => {
  const candidateId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { tenantId } = req.context;
  const { status, reason } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    res.status(400).json({
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
    });
    return;
  }

  const updatedById = req.employee?.employeeId ?? req.user?.userId;

  // Check if record exists
  const [existing] = await db
    .select({ id: candidateAllocationStatusTable.id })
    .from(candidateAllocationStatusTable)
    .where(
      and(
        eq(candidateAllocationStatusTable.candidateId, candidateId),
        eq(candidateAllocationStatusTable.tenantId, tenantId),
      ),
    );

  if (existing) {
    const [updated] = await db
      .update(candidateAllocationStatusTable)
      .set({ status, reason: reason ?? null, updatedById, updatedAt: new Date() })
      .where(eq(candidateAllocationStatusTable.id, existing.id))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db
      .insert(candidateAllocationStatusTable)
      .values({ tenantId, candidateId, status, reason: reason ?? null, updatedById })
      .returning();
    res.status(201).json(created);
  }
});

export default router;
