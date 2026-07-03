import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { candidatePipelineTable, candidatesTable, activityLogsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

const STAGES = ["sourced", "screened", "assessed", "shortlisted", "client_interview", "offer", "joining", "post_joining", "rejected", "dropped"] as const;

const router: IRouter = Router();

router.get("/pipeline", requireAuth, async (req, res): Promise<void> => {
  const { requirementId } = req.query;

  const conditions = requirementId && typeof requirementId === "string"
    ? [eq(candidatePipelineTable.requirementId, requirementId)]
    : [];

  const entries = await db
    .select({
      id: candidatePipelineTable.id,
      candidateId: candidatePipelineTable.candidateId,
      requirementId: candidatePipelineTable.requirementId,
      stage: candidatePipelineTable.stage,
      assignedRecruiterId: candidatePipelineTable.assignedRecruiterId,
      notes: candidatePipelineTable.notes,
      stageUpdatedAt: candidatePipelineTable.stageUpdatedAt,
      createdAt: candidatePipelineTable.createdAt,
      candidate: {
        id: candidatesTable.id,
        name: candidatesTable.name,
        initials: candidatesTable.initials,
        email: candidatesTable.email,
        phone: candidatesTable.phone,
        currentRole: candidatesTable.currentRole,
        experienceYears: candidatesTable.experienceYears,
        location: candidatesTable.location,
        skills: candidatesTable.skills,
        source: candidatesTable.source,
        currentCtc: candidatesTable.currentCtc,
        expectedCtc: candidatesTable.expectedCtc,
        noticeDays: candidatesTable.noticeDays,
        summary: candidatesTable.summary,
        resumeUrl: candidatesTable.resumeUrl,
        createdAt: candidatesTable.createdAt,
      },
    })
    .from(candidatePipelineTable)
    .leftJoin(candidatesTable, eq(candidatePipelineTable.candidateId, candidatesTable.id))
    .where(conditions.length ? and(...conditions) : undefined);

  const kanban: Record<string, typeof entries> = Object.fromEntries(STAGES.map(s => [s, []]));
  entries.forEach(e => {
    if (e.stage && e.stage in kanban) kanban[e.stage].push(e);
  });

  res.json(kanban);
});

router.patch("/pipeline/:id/stage", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { stage, notes } = req.body;

  if (!stage) {
    res.status(400).json({ error: "Stage is required" });
    return;
  }

  const [entry] = await db
    .update(candidatePipelineTable)
    .set({ stage, notes, stageUpdatedAt: new Date(), updatedAt: new Date() })
    .where(eq(candidatePipelineTable.id, id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Pipeline entry not found" });
    return;
  }

  // Log activity
  await db.insert(activityLogsTable).values({
    entityType: "pipeline",
    entityId: id,
    action: `stage_changed_to_${stage}`,
    performedById: req.employee?.employeeId,
    metadata: { notes },
  });

  res.json(entry);
});

export default router;
