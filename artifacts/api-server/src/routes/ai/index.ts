/**
 * AI Routes — /api/v1/ai/*
 * All endpoints require authentication. Tenant isolation enforced.
 */

import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/auth";
import { AiService } from "../../services/ai.service";
import { AiAgentService } from "../../services/ai-agent.service";
import { prisma } from "@workspace/db-prisma";
import logger from "../../lib/logger";
import { env } from "../../config/env";

const router: IRouter = Router();

/** Helper: get or create ai_analysis row for a pipeline */
async function upsertAnalysis(tenantId: string, pipelineId: string) {
  const existing = await prisma.aiAnalysis.findFirst({
    where: {
      tenantId,
      pipelineId,
    },
  });

  if (existing) return existing;

  const created = await prisma.aiAnalysis.create({
    data: {
      tenantId,
      pipelineId,
      provider: env.AI_PROVIDER || "openai",
      model: env.AI_MODEL || null,
    },
  });
  return created;
}

// ─── GET /ai/analysis/:pipelineId ─────────────────────────────────────────────
router.get("/ai/analysis/:pipelineId", requireAuth, async (req, res): Promise<void> => {
  const { tenantId } = req.context;
  const pipelineId = Array.isArray(req.params.pipelineId) ? req.params.pipelineId[0] : req.params.pipelineId;

  try {
    const analysis = await prisma.aiAnalysis.findFirst({
      where: {
        tenantId,
        pipelineId,
      },
    });

    res.json(analysis ?? null);
  } catch (err: any) {
    console.error("Error retrieving AI analysis:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /ai/parse-resume ─────────────────────────────────────────────────────
router.post("/ai/parse-resume", requireAuth, async (req, res): Promise<void> => {
  const { resumeText, pipelineId } = req.body;
  const { tenantId } = req.context;

  if (!resumeText) {
    res.status(400).json({ error: "resumeText is required" });
    return;
  }

  try {
    const parsed = await AiService.parseResume(resumeText, tenantId);

    if (pipelineId) {
      const analysis = await upsertAnalysis(tenantId, pipelineId);
      await prisma.aiAnalysis.update({
        where: { id: analysis.id },
        data: { resumeParsed: parsed as any, updatedAt: new Date() },
      });
    }

    res.json(parsed);
  } catch (err: any) {
    console.error("Error parsing resume:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /ai/evaluate-notes ──────────────────────────────────────────────────
router.post("/ai/evaluate-notes", requireAuth, async (req, res): Promise<void> => {
  const { notes, candidateRole } = req.body;
  const { tenantId } = req.context;

  if (!notes) {
    res.status(400).json({ error: "notes are required" });
    return;
  }

  try {
    const evaluation = await AiService.evaluateInterviewerNotes(notes, candidateRole || "Professional", tenantId);
    res.json(evaluation);
  } catch (err: any) {
    console.error("Error evaluating notes:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /ai/screening-score ──────────────────────────────────────────────────
router.post("/ai/screening-score", requireAuth, async (req, res): Promise<void> => {
  const { pipelineId } = req.body;
  const { tenantId } = req.context;

  if (!pipelineId) {
    res.status(400).json({ error: "pipelineId is required" });
    return;
  }

  try {
    // Fetch candidate + job for context
    const pipeline = await prisma.candidatePipeline.findFirst({
      where: { id: pipelineId, tenantId },
      include: { candidate: true, job: true },
    });

    if (!pipeline) {
      res.status(404).json({ error: "Pipeline entry not found" });
      return;
    }

    const candidateProfile = {
      name: pipeline.candidate.name,
      currentRole: pipeline.candidate.currentRole,
      experienceYears: pipeline.candidate.experienceYears,
      skills: pipeline.candidate.skills,
      location: pipeline.candidate.location,
      currentCtc: pipeline.candidate.currentCtc,
      expectedCtc: pipeline.candidate.expectedCtc,
      noticeDays: pipeline.candidate.noticeDays,
      summary: pipeline.candidate.summary,
    };

    const jobDescription = `
Title: ${pipeline.job.title}
Description: ${pipeline.job.description ?? ""}
Required Experience: ${pipeline.job.minExperience ?? 0}-${pipeline.job.maxExperience ?? "Any"} years
Location: ${pipeline.job.location}
JD: ${pipeline.job.jdText ?? ""}
    `.trim();

    const scoreResult = await AiService.screeningScore(candidateProfile, jobDescription, tenantId);

    const analysis = await upsertAnalysis(tenantId, pipelineId);
    await prisma.aiAnalysis.update({
      where: { id: analysis.id },
      data: { screeningScore: scoreResult as any, provider: env.AI_PROVIDER, updatedAt: new Date() },
    });

    logger.info(`AI screening score generated for pipeline: ${pipelineId}`);
    res.json(scoreResult);
  } catch (err: any) {
    console.error("Error generating AI screening score:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /ai/match-score ──────────────────────────────────────────────────────
router.post("/ai/match-score", requireAuth, async (req, res): Promise<void> => {
  const { pipelineId } = req.body;
  const { tenantId } = req.context;

  if (!pipelineId) {
    res.status(400).json({ error: "pipelineId is required" });
    return;
  }

  try {
    const pipeline = await prisma.candidatePipeline.findFirst({
      where: { id: pipelineId, tenantId },
      include: { candidate: true, job: true },
    });

    if (!pipeline) {
      res.status(404).json({ error: "Pipeline entry not found" });
      return;
    }

    const matchResult = await AiService.resumeJobMatch(
      { name: pipeline.candidate.name, skills: pipeline.candidate.skills, experienceYears: pipeline.candidate.experienceYears },
      `${pipeline.job.title} ${pipeline.job.description ?? ""} ${pipeline.job.jdText ?? ""}`,
      tenantId
    );

    const analysis = await upsertAnalysis(tenantId, pipelineId);
    await prisma.aiAnalysis.update({
      where: { id: analysis.id },
      data: { matchScore: matchResult as any, updatedAt: new Date() },
    });

    res.json(matchResult);
  } catch (err: any) {
    console.error("Error generating match score:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /ai/rank-candidates ──────────────────────────────────────────────────
router.post("/ai/rank-candidates", requireAuth, async (req, res): Promise<void> => {
  const { jobId } = req.body;
  const { tenantId } = req.context;

  if (!jobId) {
    res.status(400).json({ error: "jobId is required" });
    return;
  }

  try {
    const job = await prisma.job.findFirst({ where: { id: jobId, tenantId } });
    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const pipelines = await prisma.candidatePipeline.findMany({
      where: { jobId, tenantId, deletedAt: null },
      include: { candidate: true },
    });

    const candidates = pipelines.map((p) => ({
      candidateId: p.candidate.id,
      name: p.candidate.name,
      profile: {
        currentRole: p.candidate.currentRole,
        experienceYears: p.candidate.experienceYears,
        skills: p.candidate.skills,
        location: p.candidate.location,
      },
    }));

    const ranked = await AiService.rankCandidates(
      candidates,
      `${job.title} ${job.description ?? ""} ${job.jdText ?? ""}`,
      tenantId
    );

    // Update rankScore per pipeline
    for (const r of ranked) {
      const pipeline = pipelines.find((p) => p.candidate.id === r.candidateId);
      if (pipeline) {
        const analysis = await upsertAnalysis(tenantId, pipeline.id);
        await prisma.aiAnalysis.update({
          where: { id: analysis.id },
          data: { rankScore: r.rankScore, updatedAt: new Date() },
        });
      }
    }

    res.json(ranked);
  } catch (err: any) {
    console.error("Error ranking candidates:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /ai/generate-summary/:candidateId ────────────────────────────────────
router.post("/ai/generate-summary/:candidateId", requireAuth, async (req, res): Promise<void> => {
  const candidateId = Array.isArray(req.params.candidateId) ? req.params.candidateId[0] : req.params.candidateId;
  const { pipelineId } = req.body;
  const { tenantId } = req.context;

  try {
    const candidate = await prisma.candidate.findFirst({ where: { id: candidateId, tenantId } });
    if (!candidate) {
      res.status(404).json({ error: "Candidate not found" });
      return;
    }

    const summary = await AiService.generateSummary({
      name: candidate.name,
      currentRole: candidate.currentRole,
      experienceYears: candidate.experienceYears,
      skills: candidate.skills,
      location: candidate.location,
      summary: candidate.summary,
    }, tenantId);

    // Save summary back to candidate as stringified JSON
    await prisma.candidate.update({ where: { id: candidateId }, data: { summary: JSON.stringify(summary) } });

    if (pipelineId) {
      const analysis = await upsertAnalysis(tenantId, pipelineId);
      await prisma.aiAnalysis.update({
        where: { id: analysis.id },
        data: { candidateSummary: JSON.stringify(summary), updatedAt: new Date() },
      });
    }

    res.json({ summary });
  } catch (err: any) {
    console.error("Error generating candidate summary:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /ai/interview-questions ─────────────────────────────────────────────
router.post("/ai/interview-questions", requireAuth, async (req, res): Promise<void> => {
  const { pipelineId, interviewType } = req.body;
  const { tenantId } = req.context;

  if (!pipelineId) {
    res.status(400).json({ error: "pipelineId is required" });
    return;
  }

  try {
    const pipeline = await prisma.candidatePipeline.findFirst({
      where: { id: pipelineId, tenantId },
      include: { candidate: true, job: true },
    });

    if (!pipeline) {
      res.status(404).json({ error: "Pipeline entry not found" });
      return;
    }

    const questions = await AiService.suggestInterviewQuestions(
      { name: pipeline.candidate.name, skills: pipeline.candidate.skills, experienceYears: pipeline.candidate.experienceYears, currentRole: pipeline.candidate.currentRole },
      `${pipeline.job.title} ${pipeline.job.description ?? ""}`,
      interviewType ?? "HR",
      tenantId
    );

    const analysis = await upsertAnalysis(tenantId, pipelineId);
    await prisma.aiAnalysis.update({
      where: { id: analysis.id },
      data: { interviewQuestions: questions as any, updatedAt: new Date() },
    });

    res.json({ questions });
  } catch (err: any) {
    console.error("Error generating interview questions:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /ai/assessment-recommendations/:testId ───────────────────────────────
router.post("/ai/assessment-recommendations/:testId", requireAuth, async (req, res): Promise<void> => {
  const testId = Array.isArray(req.params.testId) ? req.params.testId[0] : req.params.testId;
  const { tenantId } = req.context;

  try {
    const test = await prisma.assessmentTest.findFirst({
      where: { id: testId, tenantId },
      include: { pipeline: { include: { candidate: true } } },
    });

    if (!test) {
      res.status(404).json({ error: "Assessment test not found" });
      return;
    }

    const recommendations = await AiService.assessmentRecommendations({
      percentage: test.percentage,
      verdict: test.verdict,
      categoryScores: test.categoryScores,
      candidateName: test.pipeline.candidate.name,
    }, tenantId);

    // Save to ai_analyses + to assessment test recommendations field
    await prisma.assessmentTest.update({
      where: { id: testId },
      data: { recommendations: { aiText: recommendations } },
    });

    const analysis = await upsertAnalysis(tenantId, test.pipelineId);
    await prisma.aiAnalysis.update({
      where: { id: analysis.id },
      data: { assessmentRec: recommendations, updatedAt: new Date() },
    });

    res.json({ recommendations });
  } catch (err: any) {
    console.error("Error generating assessment recommendations:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /ai/copilot ────────────────────────────────────────────────────────
router.post("/ai/copilot", requireAuth, async (req, res): Promise<void> => {
  const { message, contextOverride } = req.body;
  const { tenantId, userId } = req.context;

  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  // Build real-time context
  let contextData = contextOverride || "";
  
  if (!contextOverride) {
    // Fetch high level context for the copilot to be aware of
    const [jobsCount, candidatesCount, pipelineCount] = await Promise.all([
      prisma.job.count({ where: { tenantId } }),
      prisma.candidate.count({ where: { tenantId } }),
      prisma.candidatePipeline.count({ where: { tenantId } }),
    ]);
    
    // Fetch top 5 active jobs
    const activeJobs = await prisma.job.findMany({
      where: { tenantId, status: "OPEN" },
      take: 5,
      select: { title: true, company: { select: { name: true } } }
    });

    contextData = `
Workspace Stats:
- Total Jobs: ${jobsCount}
- Total Candidates: ${candidatesCount}
- Active Pipeline Entries: ${pipelineCount}
- Recent Open Jobs: ${activeJobs.map(j => `${j.title} at ${j.company?.name}`).join(", ")}
    `;
  }

  try {
    const copilotResponse = await AiAgentService.chatWithCopilot(message, contextData, tenantId, userId);
    res.json(copilotResponse);
  } catch (error: any) {
    logger.error(`Copilot error: ${error.message}`);
    res.status(500).json({ error: "Failed to generate copilot response." });
  }
});

export default router;
