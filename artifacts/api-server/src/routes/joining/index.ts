import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { joiningStatusTable, postJoiningFollowupsTable, candidatePipelineTable, candidatesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

const router: IRouter = Router();

async function withCandidate(joining: typeof joiningStatusTable.$inferSelect) {
  const [pipeline] = await db.select().from(candidatePipelineTable).where(eq(candidatePipelineTable.id, joining.pipelineId));
  if (!pipeline) return { ...joining, candidate: null };
  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, pipeline.candidateId));
  return { ...joining, candidate };
}

router.get("/joining", requireAuth, async (req, res): Promise<void> => {
  const { limit = "50" } = req.query;
  const rows = await db.select().from(joiningStatusTable).limit(Number(limit));
  const result = await Promise.all(rows.map(withCandidate));
  res.json(result);
});

router.post("/joining", requireAuth, async (req, res): Promise<void> => {
  const { pipelineId, joiningDate, noticePeriodDays, noticeStartDate } = req.body;
  if (!pipelineId) {
    res.status(400).json({ error: "pipelineId required" });
    return;
  }

  const [joining] = await db
    .insert(joiningStatusTable)
    .values({
      pipelineId,
      joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      noticePeriodDays: noticePeriodDays ? Number(noticePeriodDays) : undefined,
      noticeStartDate: noticeStartDate ? new Date(noticeStartDate) : undefined,
    })
    .returning();

  res.status(201).json(await withCandidate(joining));
});

router.patch("/joining/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { joiningDate, actualJoinedAt, bgvStatus, docCollectionStatus, laptopIssued, idCardIssued } = req.body;

  const [joining] = await db
    .update(joiningStatusTable)
    .set({
      joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      actualJoinedAt: actualJoinedAt ? new Date(actualJoinedAt) : undefined,
      bgvStatus,
      docCollectionStatus,
      laptopIssued,
      idCardIssued,
      updatedAt: new Date(),
    })
    .where(eq(joiningStatusTable.id, id))
    .returning();

  if (!joining) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(await withCandidate(joining));
});

router.post("/joining/:id/followup", requireAuth, async (req, res): Promise<void> => {
  const pipelineId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  // Get the joining record to extract pipelineId
  const [joining] = await db.select().from(joiningStatusTable).where(eq(joiningStatusTable.id, pipelineId));
  const actualPipelineId = joining?.pipelineId || pipelineId;

  const { checkType, scheduledAt, notes, retentionStatus } = req.body;
  if (!checkType) {
    res.status(400).json({ error: "checkType required" });
    return;
  }

  const [followup] = await db
    .insert(postJoiningFollowupsTable)
    .values({
      pipelineId: actualPipelineId,
      checkType,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      notes,
      retentionStatus: retentionStatus || "unknown",
    })
    .returning();

  res.status(201).json(followup);
});

export default router;
