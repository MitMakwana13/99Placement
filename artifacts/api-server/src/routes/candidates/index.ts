import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/auth";
import { invalidateCache } from "../../middleware/cache.middleware";
import multer from "multer";
import { prisma } from "@workspace/db-prisma";
import { CandidateSource, PipelineStage } from "@prisma/client";
import fs from "fs";
import path from "path";
import { domainEventBus } from "../../events/event-bus";
import { DomainEvent } from "../../events/domain-event";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

const router: IRouter = Router();

const normalizeSource = (s: string): CandidateSource => {
  const map: Record<string, CandidateSource> = {
    referral: CandidateSource.REFERRAL,
    portal: CandidateSource.PORTAL,
    social: CandidateSource.SOCIAL,
    internal: CandidateSource.INTERNAL,
    direct: CandidateSource.DIRECT,
  };
  return map[s.toLowerCase()] ?? CandidateSource.PORTAL;
};

router.get("/candidates", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.context?.tenantId || req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const { search, source, location, limit = "50", offset = "0" } = req.query;

  const where: any = {
    tenantId,
    deletedAt: null,
  };

  if (source && typeof source === "string") {
    where.source = normalizeSource(source);
  }

  if (location && typeof location === "string") {
    where.location = {
      contains: location,
      mode: "insensitive",
    };
  }

  if (search && typeof search === "string") {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { currentRole: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const rows = await prisma.candidate.findMany({
      where,
      take: Number(limit),
      skip: Number(offset),
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(rows);
  } catch (err: any) {
    console.error("Error fetching candidates:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/candidates", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.context?.tenantId || req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const { name, email, phone, currentRole, experienceYears, location, skills, source, currentCtc, expectedCtc, noticeDays, summary } = req.body;

  if (!name || !email) {
    res.status(400).json({ error: "Name and email are required" });
    return;
  }

  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  try {
    const candidate = await prisma.candidate.create({
      data: {
        tenantId,
        name,
        email,
        phone,
        currentRole,
        experienceYears: experienceYears ? Number(experienceYears) : undefined,
        location,
        skills: skills ? (Array.isArray(skills) ? skills : [skills]) : undefined,
        source: source ? normalizeSource(source) : "PORTAL",
        currentCtc: currentCtc ? Number(currentCtc) : undefined,
        expectedCtc: expectedCtc ? Number(expectedCtc) : undefined,
        noticeDays: noticeDays ? Number(noticeDays) : undefined,
        summary,
        initials,
      },
    });

    invalidateCache("dashboard", tenantId).catch((err) => {
      console.error("Failed to invalidate dashboard cache on candidate creation:", err);
    });

    res.status(201).json(candidate);
  } catch (err: any) {
    console.error("Error creating candidate:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/candidates/:id", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.context?.tenantId || req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const candidate = await prisma.candidate.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!candidate) {
      res.status(404).json({ error: "Candidate not found" });
      return;
    }
    res.json(candidate);
  } catch (err: any) {
    console.error("Error fetching candidate:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/candidates/:id", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.context?.tenantId || req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, email, phone, currentRole, experienceYears, location, skills, source, currentCtc, expectedCtc, noticeDays, summary } = req.body;

  try {
    const updated = await prisma.candidate.update({
      where: {
        id,
        tenantId,
      },
      data: {
        name,
        email,
        phone,
        currentRole,
        experienceYears: experienceYears !== undefined ? (experienceYears ? Number(experienceYears) : null) : undefined,
        location,
        skills: skills ? (Array.isArray(skills) ? skills : [skills]) : undefined,
        source: source ? normalizeSource(source) : undefined,
        currentCtc: currentCtc !== undefined ? (currentCtc ? Number(currentCtc) : null) : undefined,
        expectedCtc: expectedCtc !== undefined ? (expectedCtc ? Number(expectedCtc) : null) : undefined,
        noticeDays: noticeDays !== undefined ? (noticeDays ? Number(noticeDays) : null) : undefined,
        summary,
        updatedAt: new Date(),
      },
    });

    invalidateCache("dashboard", tenantId).catch((err) => {
      console.error("Failed to invalidate dashboard cache on candidate update:", err);
    });

    res.json(updated);
  } catch (err: any) {
    console.error("Error updating candidate:", err);
    res.status(404).json({ error: "Candidate not found" });
  }
});

router.delete("/candidates/:id", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.context?.tenantId || req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    await prisma.candidate.update({
      where: {
        id,
        tenantId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    invalidateCache("dashboard", tenantId).catch((err) => {
      console.error("Failed to invalidate dashboard cache on candidate delete:", err);
    });

    res.sendStatus(204);
  } catch (err: any) {
    console.error("Error deleting candidate:", err);
    res.status(404).json({ error: "Candidate not found" });
  }
});

// ─── EPIC 2: ASYNCHRONOUS RESUME UPLOAD ──────────────────────────────────────
router.post("/candidates/upload", requireAuth, upload.single("resume"), async (req, res): Promise<void> => {
  const tenantId = req.context?.tenantId || req.user?.tenantId;
  const userId = req.context?.userId || req.user?.userId;

  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "No resume file uploaded" });
    return;
  }

  try {
    // 1. Create a "Pending" Candidate shell
    const placeholderName = file.originalname.split(".")[0] || "Unknown Candidate";
    const candidate = await prisma.candidate.create({
      data: {
        tenantId,
        name: placeholderName,
        email: `pending_${Date.now()}@processing.local`, // Temporary email
        source: "PORTAL",
        summary: "Resume is currently being processed by the AI Resume Intelligence Engine...",
      }
    });

    // 2. Create CandidateDocument
    const doc = await prisma.candidateDocument.create({
      data: {
        tenantId,
        candidateId: candidate.id,
        name: file.originalname,
        documentType: "RESUME",
        fileUrl: file.path, // Local path for MVP
        fileSize: file.size,
      }
    });

    // 2. Fire Domain Event to trigger asynchronous pipeline
    class ResumeUploadedEvent implements DomainEvent {
      readonly eventName = "RESUME_UPLOADED";
      readonly eventId = crypto.randomUUID();
      readonly occurredAt = new Date();
      constructor(
        public readonly tenantId: string,
        public readonly payload: any
      ) {}
    }

    await domainEventBus.publish(new ResumeUploadedEvent(tenantId, {
      candidateId: candidate.id,
      documentId: doc.id,
      filePath: file.path,
      mimeType: file.mimetype,
      uploadedBy: userId,
    }));

    res.status(202).json({
      message: "Resume uploaded successfully. Processing in background.",
      candidateId: candidate.id,
      documentId: doc.id
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process upload" });
  }
});

router.post("/candidates/:id/apply/:requirementId", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.context?.tenantId || req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const candidateId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const requirementId = Array.isArray(req.params.requirementId) ? req.params.requirementId[0] : req.params.requirementId;

  try {
    const entry = await prisma.candidatePipeline.create({
      data: {
        tenantId,
        candidateId,
        jobId: requirementId,
        stage: PipelineStage.SOURCED,
        assignedRecruiterId: req.employee?.employeeId || req.user?.userId || undefined,
      },
    });

    invalidateCache("dashboard", tenantId).catch((err) => {
      console.error("Failed to invalidate dashboard cache on candidate apply:", err);
    });

    res.status(201).json({
      ...entry,
      requirementId: entry.jobId,
    });
  } catch (err: any) {
    console.error("Error applying candidate to job:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
