import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { requireAuth } from "../../middleware/auth";
import { type Verdict } from "@prisma/client";

const router: IRouter = Router();

async function getScreeningWithCriteria(id: string) {
  const screening = await prisma.screeningInterview.findUnique({
    where: { id },
    include: {
      criteriaScores: true,
    },
  });
  return screening;
}

router.post("/screening", requireAuth, async (req, res): Promise<void> => {
  const { tenantId } = req.context;
  const { pipelineId, interviewerId, scheduledAt, mode, notes, criteriaScores } = req.body;
  if (!pipelineId || !interviewerId) {
    res.status(400).json({ error: "pipelineId and interviewerId required" });
    return;
  }

  const screening = await prisma.screeningInterview.create({
    data: {
      tenantId,
      pipelineId,
      interviewerId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      mode: mode || "phone",
      notes,
    },
  });

  if (criteriaScores && Array.isArray(criteriaScores)) {
    await prisma.screeningCriteriaScore.createMany({
      data: criteriaScores.map((c: { criterion: string; score: number; notes?: string }) => ({
        tenantId,
        screeningId: screening.id,
        criterion: c.criterion,
        score: c.score,
        notes: c.notes,
      })),
    });
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
  const { tenantId } = req.context;
  const { scheduledAt, mode, notes, criteriaScores } = req.body;

  const existing = await prisma.screeningInterview.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Screening not found" });
    return;
  }

  await prisma.screeningInterview.update({
    where: { id },
    data: {
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      mode,
      notes,
    },
  });

  if (criteriaScores && Array.isArray(criteriaScores)) {
    await prisma.screeningCriteriaScore.deleteMany({
      where: { screeningId: id },
    });
    await prisma.screeningCriteriaScore.createMany({
      data: criteriaScores.map((c: { criterion: string; score: number; notes?: string }) => ({
        tenantId,
        screeningId: id,
        criterion: c.criterion,
        score: c.score,
        notes: c.notes,
      })),
    });
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

  const existing = await prisma.screeningInterview.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Screening not found" });
    return;
  }

  await prisma.screeningInterview.update({
    where: { id },
    data: {
      verdict: verdict as Verdict,
      overallScore: overallScore !== undefined ? Number(overallScore) : undefined,
      notes,
      conductedAt: new Date(),
    },
  });

  const result = await getScreeningWithCriteria(id);
  res.json(result);
});

export default router;
