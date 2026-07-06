import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { InterviewVerdict } from "@prisma/client";
import { requireAuth } from "../../middleware/auth";

const router: IRouter = Router();

const normalizeVerdict = (v: string): InterviewVerdict => {
  const map: Record<string, InterviewVerdict> = {
    selected: InterviewVerdict.SELECTED,
    on_hold: InterviewVerdict.ON_HOLD,
    rejected: InterviewVerdict.REJECTED,
    no_show: InterviewVerdict.NO_SHOW,
    "on hold": InterviewVerdict.ON_HOLD,
    "no show": InterviewVerdict.NO_SHOW,
  };
  return map[v.toLowerCase()] ?? (v.toUpperCase() as InterviewVerdict);
};

function formatInterview(interview: any) {
  return {
    id: interview.id,
    tenantId: interview.tenantId,
    pipelineId: interview.pipelineId,
    clientContactId: interview.clientContactId,
    interviewerEmployeeId: interview.interviewerEmployeeId,
    scheduledAt: interview.scheduledAt,
    mode: interview.mode,
    round: interview.round,
    feedbackClient: interview.feedbackClient,
    feedbackRecruiter: interview.feedbackRecruiter,
    verdict: interview.verdict,
    conductedAt: interview.conductedAt,
    createdAt: interview.createdAt,
    updatedAt: interview.updatedAt,
    candidate: interview.pipeline?.candidate ?? null,
    clientContact: interview.clientContact ?? null,
  };
}

router.get("/client-interviews", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const { pipelineId, verdict, limit = "50" } = req.query;
  const where: any = {
    tenantId,
  };

  if (pipelineId && typeof pipelineId === "string") {
    where.pipelineId = pipelineId;
  }

  if (verdict && typeof verdict === "string") {
    where.verdict = normalizeVerdict(verdict);
  }

  try {
    const rows = await prisma.clientInterview.findMany({
      where,
      include: {
        pipeline: {
          include: {
            candidate: true,
          },
        },
        clientContact: true,
      },
      take: Number(limit),
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(rows.map(formatInterview));
  } catch (err: any) {
    console.error("Error fetching client interviews:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/client-interviews", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const { pipelineId, scheduledAt, mode, round, clientContactId } = req.body;
  if (!pipelineId || !scheduledAt) {
    res.status(400).json({ error: "pipelineId and scheduledAt required" });
    return;
  }

  try {
    const interview = await prisma.clientInterview.create({
      data: {
        tenantId,
        pipelineId,
        scheduledAt: new Date(scheduledAt),
        mode: mode || "video",
        round: round || "1",
        clientContactId: clientContactId || undefined,
      },
      include: {
        pipeline: {
          include: {
            candidate: true,
          },
        },
        clientContact: true,
      },
    });

    res.status(201).json(formatInterview(interview));
  } catch (err: any) {
    console.error("Error creating client interview:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/client-interviews/:id", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const interview = await prisma.clientInterview.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        pipeline: {
          include: {
            candidate: true,
          },
        },
        clientContact: true,
      },
    });

    if (!interview) {
      res.status(404).json({ error: "Interview not found" });
      return;
    }

    res.json(formatInterview(interview));
  } catch (err: any) {
    console.error("Error fetching client interview details:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/client-interviews/:id/feedback", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { feedbackClient, feedbackRecruiter, verdict, conductedAt } = req.body;
  if (!verdict) {
    res.status(400).json({ error: "verdict required" });
    return;
  }

  try {
    const interview = await prisma.clientInterview.update({
      where: {
        id,
        tenantId,
      },
      data: {
        feedbackClient,
        feedbackRecruiter,
        verdict: normalizeVerdict(verdict),
        conductedAt: conductedAt ? new Date(conductedAt) : new Date(),
        updatedAt: new Date(),
      },
      include: {
        pipeline: {
          include: {
            candidate: true,
          },
        },
        clientContact: true,
      },
    });

    res.json(formatInterview(interview));
  } catch (err: any) {
    console.error("Error updating client interview feedback:", err);
    res.status(404).json({ error: "Interview not found" });
  }
});

export default router;
