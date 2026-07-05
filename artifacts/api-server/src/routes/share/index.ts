/**
 * Candidate Share Link Routes — /api/v1/share/*
 * - Authenticated routes: create + manage share links
 * - Public route: view candidate profile via token (no auth required)
 */

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { candidateShareLinksTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { prisma } from "@workspace/db-prisma";
import { SubscriptionService } from "../../services/subscription.service";
import crypto from "crypto";
import logger from "../../lib/logger";

const router: IRouter = Router();

// ─── POST /share/candidate/:pipelineId — Generate share link ───────────────────
router.post("/share/candidate/:pipelineId", requireAuth, async (req, res): Promise<void> => {
  const pipelineId = Array.isArray(req.params.pipelineId) ? req.params.pipelineId[0] : req.params.pipelineId;
  const { tenantId } = req.context;
  const { expiryHours = 48 } = req.body;

  // 1. Subscription feature-gate check
  const subscription = await SubscriptionService.getSubscription(tenantId);
  const features = (subscription?.plan?.features as any) || {};
  if (!features.clientPortal) {
    res.status(402).json({
      error: "Client Portal feature is not active under this workspace's current plan. Please upgrade to use this feature.",
    });
    return;
  }

  const pipeline = await prisma.candidatePipeline.findFirst({
    where: { id: pipelineId, tenantId },
    include: { candidate: true },
  });

  if (!pipeline) {
    res.status(404).json({ error: "Pipeline entry not found" });
    return;
  }

  // Generate a cryptographically secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  const [link] = await db
    .insert(candidateShareLinksTable)
    .values({
      tenantId,
      pipelineId,
      token,
      expiresAt,
      isActive: "true",
      createdById: req.employee?.employeeId ?? req.user?.userId,
    })
    .returning();

  const shareUrl = `${process.env.CLIENT_URL ?? "http://localhost:3000"}/share/${token}`;

  logger.info(`Share link created for pipeline ${pipelineId}, expires: ${expiresAt.toISOString()}`);
  res.status(201).json({ shareUrl, token, expiresAt, candidateName: pipeline.candidate.name });
});

// ─── GET /share/links/:pipelineId — List existing links ───────────────────────
router.get("/share/links/:pipelineId", requireAuth, async (req, res): Promise<void> => {
  const pipelineId = Array.isArray(req.params.pipelineId) ? req.params.pipelineId[0] : req.params.pipelineId;
  const { tenantId } = req.context;

  const links = await db
    .select()
    .from(candidateShareLinksTable)
    .where(and(eq(candidateShareLinksTable.pipelineId, pipelineId), eq(candidateShareLinksTable.tenantId, tenantId)));

  res.json(links);
});

// ─── DELETE /share/:token — Revoke link ────────────────────────────────────────
router.delete("/share/:token", requireAuth, async (req, res): Promise<void> => {
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;

  await db
    .update(candidateShareLinksTable)
    .set({ isActive: "false" })
    .where(eq(candidateShareLinksTable.token, token));

  res.sendStatus(204);
});

// ─── GET /share/:token — PUBLIC: View candidate profile ───────────────────────
// No requireAuth — accessible by client without login
router.get("/share/:token", async (req, res): Promise<void> => {
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;

  const [link] = await db
    .select()
    .from(candidateShareLinksTable)
    .where(and(eq(candidateShareLinksTable.token, token), eq(candidateShareLinksTable.isActive, "true")));

  if (!link) {
    res.status(404).json({ error: "Share link not found or has been revoked" });
    return;
  }

  // 1. Subscription feature-gate check for client portal
  const subscription = await SubscriptionService.getSubscription(link.tenantId);
  const features = (subscription?.plan?.features as any) || {};
  if (!features.clientPortal) {
    res.status(402).json({ error: "Client Portal feature is disabled under this workspace's current plan." });
    return;
  }

  if (new Date() > link.expiresAt) {
    res.status(410).json({ error: "This share link has expired" });
    return;
  }

  // Mark as viewed (first view)
  if (!link.viewedAt) {
    await db
      .update(candidateShareLinksTable)
      .set({ viewedAt: new Date() })
      .where(eq(candidateShareLinksTable.token, token));
  }

  // Fetch full candidate data
  const pipeline = await prisma.candidatePipeline.findFirst({
    where: { id: link.pipelineId },
    include: {
      candidate: {
        include: {
          documents: true,
          educations: true,
          experiences: true,
          skillsList: true,
        },
      },
      job: { select: { title: true, location: true, description: true } },
      screeningInterviews: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          communicationScore: true, technicalScore: true, experienceScore: true,
          overallScore: true, verdict: true, recommendation: true,
        },
      },
      assessmentTests: {
        where: { completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: {
          percentage: true, verdict: true, categoryScores: true, completedAt: true,
        },
      },
    },
  });

  if (!pipeline) {
    res.status(404).json({ error: "Candidate data not found" });
    return;
  }

  // Fetch AI analysis if exists
  const [aiAnalysis] = await db
    .select()
    .from((await import("@workspace/db/schema")).aiAnalysesTable)
    .where(eq((await import("@workspace/db/schema")).aiAnalysesTable.pipelineId, link.pipelineId));

  // Return sanitized public profile
  const { candidate } = pipeline;
  res.json({
    shareLink: {
      token,
      expiresAt: link.expiresAt,
      clientDecision: link.clientDecision,
    },
    candidate: {
      id: candidate.id,
      name: candidate.name,
      currentRole: candidate.currentRole,
      experienceYears: candidate.experienceYears,
      location: candidate.location,
      skills: candidate.skills,
      summary: candidate.summary,
      resumeUrl: candidate.resumeUrl,
      educations: candidate.educations,
      experiences: candidate.experiences,
    },
    job: pipeline.job,
    screening: pipeline.screeningInterviews[0] ?? null,
    assessment: pipeline.assessmentTests[0] ?? null,
    aiScore: aiAnalysis?.screeningScore ?? null,
    matchScore: aiAnalysis?.matchScore ?? null,
  });
});

// ─── POST /share/:token/decision — Client submits Approve/Reject/Need Interview ─
router.post("/share/:token/decision", async (req, res): Promise<void> => {
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const { decision, feedback } = req.body;

  if (!["APPROVED", "REJECTED", "NEED_INTERVIEW"].includes(decision)) {
    res.status(400).json({ error: "Invalid decision. Must be APPROVED, REJECTED, or NEED_INTERVIEW" });
    return;
  }

  const [link] = await db
    .select()
    .from(candidateShareLinksTable)
    .where(and(eq(candidateShareLinksTable.token, token), eq(candidateShareLinksTable.isActive, "true")));

  if (!link) {
    res.status(404).json({ error: "Share link not found or revoked" });
    return;
  }

  // 1. Subscription feature-gate check for client portal
  const subscription = await SubscriptionService.getSubscription(link.tenantId);
  const features = (subscription?.plan?.features as any) || {};
  if (!features.clientPortal) {
    res.status(402).json({ error: "Client Portal feature is disabled under this workspace's current plan." });
    return;
  }

  if (new Date() > link.expiresAt) {
    res.status(410).json({ error: "This share link has expired" });
    return;
  }

  await db
    .update(candidateShareLinksTable)
    .set({ clientDecision: decision, clientFeedback: feedback ?? null })
    .where(eq(candidateShareLinksTable.token, token));

  logger.info(`Client decision [${decision}] recorded for pipeline ${link.pipelineId}`);
  res.json({ success: true, decision });
});

export default router;
