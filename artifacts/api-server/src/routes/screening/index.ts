import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { screeningInterviewsTable, screeningCriteriaScoresTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

const router: IRouter = Router();

async function getScreeningWithCriteria(id: string) {
  const [screening] = await db.select().from(screeningInterviewsTable).where(eq(screeningInterviewsTable.id, id));
  if (!screening) return null;
  const criteriaScores = await db.select().from(screeningCriteriaScoresTable).where(eq(screeningCriteriaScoresTable.screeningId, id));
  return { ...screening, criteriaScores };
}

router.post("/screening", requireAuth, async (req, res): Promise<void> => {
  const { pipelineId, interviewerId, scheduledAt, mode, notes, criteriaScores } = req.body;
  if (!pipelineId || !interviewerId) {
    res.status(400).json({ error: "pipelineId and interviewerId required" });
    return;
  }

  const [screening] = await db
    .insert(screeningInterviewsTable)
    .values({
      pipelineId,
      interviewerId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      mode: mode || "phone",
      notes,
    })
    .returning();

  if (criteriaScores && Array.isArray(criteriaScores)) {
    await db.insert(screeningCriteriaScoresTable).values(
      criteriaScores.map((c: { criterion: string; score: number; notes?: string }) => ({
        screeningId: screening.id,
        criterion: c.criterion,
        score: c.score,
        notes: c.notes,
      }))
    );
  }

  const result = await getScreeningWithCriteria(screening.id);
  res.status(201).json(result);
});

router.get("/screening/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await getScreeningWithCriteria(id);
  if (!result) {
    res.status(404).json({ error: "Screening not found" });
    return;
  }
  res.json(result);
});

router.patch("/screening/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { scheduledAt, mode, notes, criteriaScores } = req.body;

  const [existing] = await db.select({ id: screeningInterviewsTable.id }).from(screeningInterviewsTable).where(eq(screeningInterviewsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Screening not found" });
    return;
  }

  await db
    .update(screeningInterviewsTable)
    .set({ scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined, mode, notes, updatedAt: new Date() })
    .where(eq(screeningInterviewsTable.id, id));

  if (criteriaScores && Array.isArray(criteriaScores)) {
    await db.delete(screeningCriteriaScoresTable).where(eq(screeningCriteriaScoresTable.screeningId, id));
    await db.insert(screeningCriteriaScoresTable).values(
      criteriaScores.map((c: { criterion: string; score: number; notes?: string }) => ({
        screeningId: id,
        criterion: c.criterion,
        score: c.score,
        notes: c.notes,
      }))
    );
  }

  const result = await getScreeningWithCriteria(id);
  res.json(result);
});

router.post("/screening/:id/submit", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { verdict, overallScore, notes } = req.body;
  if (!verdict) {
    res.status(400).json({ error: "Verdict is required" });
    return;
  }

  const [existing] = await db.select({ id: screeningInterviewsTable.id }).from(screeningInterviewsTable).where(eq(screeningInterviewsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Screening not found" });
    return;
  }

  await db
    .update(screeningInterviewsTable)
    .set({ verdict, overallScore, notes, conductedAt: new Date(), updatedAt: new Date() })
    .where(eq(screeningInterviewsTable.id, id));

  const result = await getScreeningWithCriteria(id);
  res.json(result);
});

export default router;
