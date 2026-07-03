/**
 * AI Routes — /api/v1/ai/*
 * All endpoints require authentication. Tenant isolation enforced.
 */

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  aiAnalysesTable,
  candidatePipelineTable,
  candidatesTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { AiService } from "../../services/ai.service";
import { prisma } from "@workspace/db-prisma";
import logger from "../../lib/logger";
import { env } from "../../config/env";

const router: IRouter = Router();

/** Helper: get or create ai_analysis row for a pipeline */
async function upsertAnalysis(tenantId: string, pipelineId: string) {
  const [existing] = await db
    .select()
    .from(aiAnalysesTable)
    .where(and(eq(aiAnalysesTable.tenantId, tenantId), eq(aiAnalysesTable.pipelineId, pipelineId)));

  if (existing) return existing;

  const [created] = await db
    .insert(aiAnalysesTable)
    .values({ tenantId, pipelineId, provider: env.AI_PROVIDER, model: env.AI_MODEL })
    .returning();
  return created;
}

// ─── GET /ai/analysis/:pipelineId ─────────────────────────────────────────────
router.get("/ai/analysis/:pipelineId", requireAuth, async (req, res): Promise<void> => {
  const { tenantId } = req.context;
  const pipelineId = Array.isArray(req.params.pipelineId) ? req.params.pipelineId[0] : req.params.pipelineId;

  const [analysis] = await db
    .select()
    .from(aiAnalysesTable)
    .where(and(eq(aiAnalysesTable.tenantId, tenantId), eq(aiAnalysesTable.pipelineId, pipelineId)));

  res.json(analysis ?? null);
});

// ─── POST /ai/parse-resume ─────────────────────────────────────────────────────
router.post("/ai/parse-resume", requireAuth, async (req, res): Promise<void> => {
  const { resumeText, pipelineId } = req.body;
  const { tenantId } = req.context;

  if (!resumeText) {
    res.status(400).json({ error: "resumeText is required" });
    return;
  }

  const parsed = await AiService.parseResume(resumeText);

  if (pipelineId) {
    const analysis = await upsertAnalysis(tenantId, pipelineId);
    await db
      .update(aiAnalysesTable)
      .set({ resumeParsed: parsed, updatedAt: new Date() })
      .where(eq(aiAnalysesTable.id, analysis.id));
  }

  res.json(parsed);
});

// ─── POST /ai/screening-score ──────────────────────────────────────────────────
router.post("/ai/screening-score", requireAuth, async (req, res): Promise<void> => {
  const { pipelineId } = req.body;
  const { tenantId } = req.context;

  if (!pipelineId) {
    res.status(400).json({ error: "pipelineId is required" });
    return;
  }

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

  const scoreResult = await AiService.screeningScore(candidateProfile, jobDescription);

  const analysis = await upsertAnalysis(tenantId, pipelineId);
  await db
    .update(aiAnalysesTable)
    .set({ screeningScore: scoreResult, provider: env.AI_PROVIDER, updatedAt: new Date() })
    .where(eq(aiAnalysesTable.id, analysis.id));

  logger.info(`AI screening score generated for pipeline: ${pipelineId}`);
  res.json(scoreResult);
});

// ─── POST /ai/match-score ──────────────────────────────────────────────────────
router.post("/ai/match-score", requireAuth, async (req, res): Promise<void> => {
  const { pipelineId } = req.body;
  const { tenantId } = req.context;

  if (!pipelineId) {
    res.status(400).json({ error: "pipelineId is required" });
    return;
  }

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
  );

  const analysis = await upsertAnalysis(tenantId, pipelineId);
  await db
    .update(aiAnalysesTable)
    .set({ matchScore: matchResult, updatedAt: new Date() })
    .where(eq(aiAnalysesTable.id, analysis.id));

  res.json(matchResult);
});

// ─── POST /ai/rank-candidates ──────────────────────────────────────────────────
router.post("/ai/rank-candidates", requireAuth, async (req, res): Promise<void> => {
  const { jobId } = req.body;
  const { tenantId } = req.context;

  if (!jobId) {
    res.status(400).json({ error: "jobId is required" });
    return;
  }

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
  );

  // Update rankScore per pipeline
  for (const r of ranked) {
    const pipeline = pipelines.find((p) => p.candidate.id === r.candidateId);
    if (pipeline) {
      const analysis = await upsertAnalysis(tenantId, pipeline.id);
      await db
        .update(aiAnalysesTable)
        .set({ rankScore: r.rankScore, updatedAt: new Date() })
        .where(eq(aiAnalysesTable.id, analysis.id));
    }
  }

  res.json(ranked);
});

// ─── POST /ai/generate-summary/:candidateId ────────────────────────────────────
router.post("/ai/generate-summary/:candidateId", requireAuth, async (req, res): Promise<void> => {
  const candidateId = Array.isArray(req.params.candidateId) ? req.params.candidateId[0] : req.params.candidateId;
  const { pipelineId } = req.body;
  const { tenantId } = req.context;

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
  });

  // Save summary back to candidate
  await prisma.candidate.update({ where: { id: candidateId }, data: { summary } });

  if (pipelineId) {
    const analysis = await upsertAnalysis(tenantId, pipelineId);
    await db
      .update(aiAnalysesTable)
      .set({ candidateSummary: summary, updatedAt: new Date() })
      .where(eq(aiAnalysesTable.id, analysis.id));
  }

  res.json({ summary });
});

// ─── POST /ai/interview-questions ─────────────────────────────────────────────
router.post("/ai/interview-questions", requireAuth, async (req, res): Promise<void> => {
  const { pipelineId, interviewType } = req.body;
  const { tenantId } = req.context;

  if (!pipelineId) {
    res.status(400).json({ error: "pipelineId is required" });
    return;
  }

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
  );

  const analysis = await upsertAnalysis(tenantId, pipelineId);
  await db
    .update(aiAnalysesTable)
    .set({ interviewQuestions: questions, updatedAt: new Date() })
    .where(eq(aiAnalysesTable.id, analysis.id));

  res.json({ questions });
});

// ─── POST /ai/assessment-recommendations/:testId ───────────────────────────────
router.post("/ai/assessment-recommendations/:testId", requireAuth, async (req, res): Promise<void> => {
  const testId = Array.isArray(req.params.testId) ? req.params.testId[0] : req.params.testId;
  const { tenantId } = req.context;

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
  });

  // Save to ai_analyses + to assessment test recommendations field
  await prisma.assessmentTest.update({
    where: { id: testId },
    data: { recommendations: { aiText: recommendations } },
  });

  const analysis = await upsertAnalysis(tenantId, test.pipelineId);
  await db
    .update(aiAnalysesTable)
    .set({ assessmentRec: recommendations, updatedAt: new Date() })
    .where(eq(aiAnalysesTable.id, analysis.id));

  res.json({ recommendations });
});

export default router;
