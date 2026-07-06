import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { PipelineStage } from "@prisma/client";
import { requireAuth } from "../../middleware/auth";
import { invalidateCache } from "../../middleware/cache.middleware";

const router: IRouter = Router();

const STAGES = ["SOURCED", "SCREENED", "ASSESSED", "SHORTLISTED", "CLIENT_INTERVIEW", "OFFER", "JOINING", "POST_JOINING", "REJECTED", "DROPPED"] as const;
type StageKey = typeof STAGES[number];

// Map lowercase frontend stage values to Prisma uppercase equivalents
const normalizeStage = (s: string): PipelineStage => {
  const map: Record<string, PipelineStage> = {
    sourced: PipelineStage.SOURCED,
    screened: PipelineStage.SCREENED,
    assessed: PipelineStage.ASSESSED,
    shortlisted: PipelineStage.SHORTLISTED,
    client_interview: PipelineStage.CLIENT_INTERVIEW,
    offer: PipelineStage.OFFER,
    joining: PipelineStage.JOINING,
    post_joining: PipelineStage.POST_JOINING,
    rejected: PipelineStage.REJECTED,
    dropped: PipelineStage.DROPPED,
  };
  return map[s.toLowerCase()] ?? (s.toUpperCase() as PipelineStage);
};

router.get("/pipeline", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const { requirementId } = req.query;

  const where: any = {
    tenantId,
    deletedAt: null,
  };

  if (requirementId && typeof requirementId === "string") {
    where.jobId = requirementId;
  }

  try {
    const entries = await prisma.candidatePipeline.findMany({
      where,
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            initials: true,
            email: true,
            phone: true,
            currentRole: true,
            experienceYears: true,
            location: true,
            skills: true,
            source: true,
            currentCtc: true,
            expectedCtc: true,
            noticeDays: true,
            summary: true,
            resumeUrl: true,
            createdAt: true,
          },
        },
      },
    });

    const mappedEntries = entries.map(e => ({
      id: e.id,
      candidateId: e.candidateId,
      requirementId: e.jobId,
      stage: e.stage,
      assignedRecruiterId: e.assignedRecruiterId,
      notes: e.notes,
      stageUpdatedAt: e.stageUpdatedAt,
      createdAt: e.createdAt,
      candidate: e.candidate,
    }));

    const kanban: Record<string, typeof mappedEntries> = Object.fromEntries(
      STAGES.map(s => [s.toLowerCase(), []])
    );

    mappedEntries.forEach(e => {
      const key = (e.stage ?? "").toLowerCase();
      // Normalize client_interview / client-interview matches
      const normalizedKey = key.replace(/_([a-z])/g, (_, c) => `_${c}`);
      if (normalizedKey in kanban) {
        kanban[normalizedKey].push(e);
      }
    });

    res.json(kanban);
  } catch (err: any) {
    console.error("Error fetching pipeline entries:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/pipeline/:id/stage", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { stage, notes } = req.body;

  if (!stage) {
    res.status(400).json({ error: "Stage is required" });
    return;
  }

  try {
    const entry = await prisma.candidatePipeline.update({
      where: {
        id,
        tenantId,
      },
      data: {
        stage: normalizeStage(stage),
        notes,
        stageUpdatedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        tenantId,
        entityType: "pipeline",
        entityId: id,
        action: `stage_changed_to_${stage}`,
        performedById: req.employee?.employeeId || req.user?.userId,
        metadata: notes ? { notes } : undefined,
      },
    });

    const tenant = tenantId || "global";
    invalidateCache("dashboard", tenant).catch((err) => {
      console.error("Failed to invalidate dashboard cache on stage update:", err);
    });

    res.json({
      ...entry,
      requirementId: entry.jobId, // align with DRIZZLE field mapping
    });
  } catch (err: any) {
    console.error("Error updating pipeline stage:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
