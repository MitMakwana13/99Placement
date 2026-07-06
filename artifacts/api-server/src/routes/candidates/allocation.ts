/**
 * Candidate Allocation Status Routes — /api/v1/candidates/:id/allocation
 * Tracks granular allocation states: AVAILABLE → BLACKLISTED
 */

import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/auth";
import { prisma } from "@workspace/db-prisma";
import { AllocationStatus } from "@prisma/client";

const router: IRouter = Router();

const VALID_STATUSES = Object.values(AllocationStatus);

// ─── GET /candidates/:id/allocation ────────────────────────────────────────────
router.get("/candidates/:id/allocation", requireAuth, async (req, res): Promise<void> => {
  const candidateId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const tenantId = req.context?.tenantId || req.user?.tenantId;

  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  try {
    const status = await prisma.candidateAllocationStatus.findFirst({
      where: {
        candidateId,
        tenantId,
      },
    });

    // Return default AVAILABLE if no record exists yet
    res.json(status ?? { candidateId, status: AllocationStatus.AVAILABLE, reason: null });
  } catch (err: any) {
    console.error("Error fetching allocation status:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /candidates/:id/allocation ──────────────────────────────────────────
router.patch("/candidates/:id/allocation", requireAuth, async (req, res): Promise<void> => {
  const candidateId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const tenantId = req.context?.tenantId || req.user?.tenantId;
  const { status, reason } = req.body;

  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  if (!status || !VALID_STATUSES.includes(status as any)) {
    res.status(400).json({
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
    });
    return;
  }

  const updatedById = req.employee?.employeeId ?? req.user?.userId;

  try {
    // Check if record exists
    const existing = await prisma.candidateAllocationStatus.findFirst({
      where: {
        candidateId,
        tenantId,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      const updated = await prisma.candidateAllocationStatus.update({
        where: {
          id: existing.id,
        },
        data: {
          status: status as AllocationStatus,
          reason: reason ?? null,
          updatedById,
          updatedAt: new Date(),
        },
      });
      res.json(updated);
    } else {
      const created = await prisma.candidateAllocationStatus.create({
        data: {
          tenantId,
          candidateId,
          status: status as AllocationStatus,
          reason: reason ?? null,
          updatedById,
        },
      });
      res.status(201).json(created);
    }
  } catch (err: any) {
    console.error("Error updating candidate allocation status:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
