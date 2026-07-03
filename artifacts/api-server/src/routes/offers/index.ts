import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { offerLettersTable, candidatePipelineTable, candidatesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

const router: IRouter = Router();

async function withCandidate(offer: typeof offerLettersTable.$inferSelect) {
  const [pipeline] = await db.select().from(candidatePipelineTable).where(eq(candidatePipelineTable.id, offer.pipelineId));
  if (!pipeline) return { ...offer, candidate: null };
  const [candidate] = await db.select().from(candidatesTable).where(eq(candidatesTable.id, pipeline.candidateId));
  return { ...offer, candidate };
}

router.get("/offers", requireAuth, async (req, res): Promise<void> => {
  const { status, limit = "50" } = req.query;
  const conditions = status && typeof status === "string"
    ? [eq(offerLettersTable.status, status as any)]
    : [];

  const rows = await db
    .select()
    .from(offerLettersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(Number(limit));

  const result = await Promise.all(rows.map(withCandidate));
  res.json(result);
});

router.post("/offers", requireAuth, async (req, res): Promise<void> => {
  const { pipelineId, offeredCtc, designation, joiningDate } = req.body;
  if (!pipelineId) {
    res.status(400).json({ error: "pipelineId required" });
    return;
  }

  const [offer] = await db
    .insert(offerLettersTable)
    .values({
      pipelineId,
      offeredCtc: offeredCtc ? Number(offeredCtc) : undefined,
      designation,
      joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      status: "drafted",
    })
    .returning();

  res.status(201).json(await withCandidate(offer));
});

router.get("/offers/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [offer] = await db.select().from(offerLettersTable).where(eq(offerLettersTable.id, id));
  if (!offer) {
    res.status(404).json({ error: "Offer not found" });
    return;
  }
  res.json(await withCandidate(offer));
});

router.patch("/offers/:id/status", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { status } = req.body;
  if (!status) {
    res.status(400).json({ error: "status required" });
    return;
  }

  const extra: Record<string, Date | undefined> = {};
  if (status === "sent") extra.sentAt = new Date();
  if (status === "accepted") extra.acceptedAt = new Date();

  const [offer] = await db
    .update(offerLettersTable)
    .set({ status, ...extra, updatedAt: new Date() })
    .where(eq(offerLettersTable.id, id))
    .returning();

  if (!offer) {
    res.status(404).json({ error: "Offer not found" });
    return;
  }
  res.json(await withCandidate(offer));
});

export default router;
