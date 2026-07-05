import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { candidatesTable, candidatePipelineTable } from "@workspace/db/schema";
import { eq, and, isNull, ilike, or } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { invalidateCache } from "../../middleware/cache.middleware";
import multer from "multer";
import { prisma } from "@workspace/db-prisma";
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

router.get("/candidates", requireAuth, async (req, res): Promise<void> => {
  const { search, source, location, limit = "50", offset = "0" } = req.query;

  const conditions = [isNull(candidatesTable.deletedAt)];
  if (source && typeof source === "string") conditions.push(eq(candidatesTable.source, source as any));
  if (location && typeof location === "string") conditions.push(ilike(candidatesTable.location, `%${location}%`));
  if (search && typeof search === "string") {
    conditions.push(
      or(
        ilike(candidatesTable.name, `%${search}%`),
        ilike(candidatesTable.email, `%${search}%`),
        ilike(candidatesTable.currentRole, `%${search}%`),
      )!
    );
  }

  const rows = await db
    .select()
    .from(candidatesTable)
    .where(and(...conditions))
    .limit(Number(limit))
    .offset(Number(offset));

  res.json(rows);
});

router.post("/candidates", requireAuth, async (req, res): Promise<void> => {
  const { name, email, phone, currentRole, experienceYears, location, skills, source, currentCtc, expectedCtc, noticeDays, summary } = req.body;

  if (!name || !email) {
    res.status(400).json({ error: "Name and email are required" });
    return;
  }

  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const tenantId = req.user?.tenantId || "4f019263-832c-45f4-989c-9ca1ddff6bfd";

  const [candidate] = await db
    .insert(candidatesTable)
    .values({
      tenantId,
      name, email, phone, currentRole,
      experienceYears: experienceYears ? Number(experienceYears) : undefined,
      location, skills, source: source || "portal",
      currentCtc: currentCtc ? Number(currentCtc) : undefined,
      expectedCtc: expectedCtc ? Number(expectedCtc) : undefined,
      noticeDays: noticeDays ? Number(noticeDays) : undefined,
      summary, initials,
    })
    .returning();

  invalidateCache("dashboard", tenantId).catch((err) => {
    console.error("Failed to invalidate dashboard cache on candidate creation:", err);
  });

  res.status(201).json(candidate);
});

router.get("/candidates/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(and(eq(candidatesTable.id, id), isNull(candidatesTable.deletedAt)));

  if (!candidate) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }
  res.json(candidate);
});

router.patch("/candidates/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, email, phone, currentRole, experienceYears, location, skills, source, currentCtc, expectedCtc, noticeDays, summary } = req.body;

  const [updated] = await db
    .update(candidatesTable)
    .set({ name, email, phone, currentRole, experienceYears, location, skills, source, currentCtc, expectedCtc, noticeDays, summary, updatedAt: new Date() })
    .where(and(eq(candidatesTable.id, id), isNull(candidatesTable.deletedAt)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Candidate not found" });
    return;
  }

  const tenantId = req.user?.tenantId || "global";
  invalidateCache("dashboard", tenantId).catch((err) => {
    console.error("Failed to invalidate dashboard cache on candidate update:", err);
  });

  res.json(updated);
});

router.delete("/candidates/:id", requireAuth, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.update(candidatesTable).set({ deletedAt: new Date() }).where(eq(candidatesTable.id, id));

  const tenantId = req.user?.tenantId || "global";
  invalidateCache("dashboard", tenantId).catch((err) => {
    console.error("Failed to invalidate dashboard cache on candidate delete:", err);
  });

  res.sendStatus(204);
});

// ─── EPIC 2: ASYNCHRONOUS RESUME UPLOAD ──────────────────────────────────────
router.post("/candidates/upload", requireAuth, upload.single("resume"), async (req, res): Promise<void> => {
  const { tenantId, userId } = req.context;
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
  const candidateId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const requirementId = Array.isArray(req.params.requirementId) ? req.params.requirementId[0] : req.params.requirementId;

  const tenantId = req.user?.tenantId || "4f019263-832c-45f4-989c-9ca1ddff6bfd";

  const [entry] = await db
    .insert(candidatePipelineTable)
    .values({
      tenantId,
      candidateId,
      requirementId,
      stage: "SOURCED",
      assignedRecruiterId: req.employee?.employeeId,
    })
    .returning();

  invalidateCache("dashboard", tenantId).catch((err) => {
    console.error("Failed to invalidate dashboard cache on candidate apply:", err);
  });

  res.status(201).json(entry);
});

export default router;
