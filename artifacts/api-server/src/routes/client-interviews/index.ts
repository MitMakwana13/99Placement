import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { clientInterviewsTable, candidatePipelineTable, candidatesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

const router: IRouter = Router();

async function withCandidate(interview: typeof clientInterviewsTable.$inferSelect) {
  const [pipeline] = await db.select().from(candidatePipelineTable).where(eq(candidatePipelineTable.id, interview.pipelineId));
  if (!pipeline) return { ...interview, candidate: null };
  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, pipeline.candidateId));
  return { ...interview, candidate };
}

router.get("/client-interviews", requireAuth, async (req, res): Promise<void> => {
  const { pipelineId, verdict, limit = "50" } = req.query;
  const conditions = [];
  if (pipelineId && typeof pipelineId === "string") conditions.push(eq(clientInterviewsTable.pipelineId, pipelineId));
  if (verdict && typeof verdict === "string") conditions.push(eq(clientInterviewsTable.verdict, verdict as any));

  const rows = await db
    .select()
    .from(clientInterviewsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(Number(limit));

  const result = await Promise.all(rows.map(withCandidate));
  res.json(result);
});

router.post("/client-interviews", requireAuth, async (req, res): Promise<void> => {
  const { tenantId } = req.context;
  const { pipelineId, scheduledAt, mode, round, clientContactId } = req.body;
  if (!pipelineId || !scheduledAt) {
    res.status(400).json({ error: "pipelineId and scheduledAt required" });
    return;
  }

  const [interview] = await db
    .insert(clientInterviewsTable)
    .values({
      tenantId,
      pipelineId,
      scheduledAt: new Date(scheduledAt),
      mode: mode || "video",
      round: round || "1",
      clientContactId,
    })
    .returning();

  const result = await withCandidate(interview);
  res.status(201).json(result);
});

router.get("/client-interviews/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [interview] = await db.select().from(clientInterviewsTable).where(eq(clientInterviewsTable.id, id));
  if (!interview) {
    res.status(404).json({ error: "Interview not found" });
    return;
  }
  res.json(await withCandidate(interview));
});

router.post("/client-interviews/:id/feedback", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { feedbackClient, feedbackRecruiter, verdict, conductedAt } = req.body;
  if (!verdict) {
    res.status(400).json({ error: "verdict required" });
    return;
  }

  const [interview] = await db
    .update(clientInterviewsTable)
    .set({ feedbackClient, feedbackRecruiter, verdict, conductedAt: conductedAt ? new Date(conductedAt) : new Date(), updatedAt: new Date() })
    .where(eq(clientInterviewsTable.id, id))
    .returning();

  if (!interview) {
    res.status(404).json({ error: "Interview not found" });
    return;
  }
  res.json(await withCandidate(interview));
});

export default router;
