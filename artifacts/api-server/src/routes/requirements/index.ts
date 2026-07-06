import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { requireAuth } from "../../middleware/auth";

const router: IRouter = Router();

router.get("/requirements", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const { status, urgency, companyId, search, limit = "50", offset = "0" } = req.query;

  const where: any = {
    tenantId,
    deletedAt: null,
  };

  if (status && typeof status === "string") {
    where.status = status.toUpperCase();
  }
  if (urgency && typeof urgency === "string") {
    where.urgency = urgency.toUpperCase();
  }
  if (companyId && typeof companyId === "string") {
    where.companyId = companyId;
  }
  if (search && typeof search === "string") {
    where.title = {
      contains: search,
      mode: "insensitive",
    };
  }

  try {
    const jobs = await prisma.job.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            website: true,
            gstin: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      take: Number(limit),
      skip: Number(offset),
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(
      jobs.map((job) => ({
        id: job.id,
        companyId: job.companyId,
        recruiterId: job.recruiterId,
        title: job.title,
        location: job.location,
        jobType: job.jobType,
        urgency: job.urgency.toLowerCase(),
        salaryBand: job.salaryBand,
        jdText: job.jdText,
        openingsCount: job.openingsCount,
        status: job.status.toLowerCase(),
        deadline: job.deadline,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        company: job.company,
        stageCounts: {},
      }))
    );
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/requirements", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const { companyId, title, location, jobType, urgency, salaryBand, jdText, openingsCount, status, deadline, recruiterId } = req.body;
  if (!companyId || !title || !location) {
    res.status(400).json({ error: "companyId, title and location are required" });
    return;
  }

  // Generate a random-ish unique code for this Job
  const cleanTitle = title.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const code = `JOB-${cleanTitle}-${randomSuffix}`;

  // Map Drizzle urgency ("normal" / "high" / "critical") to Prisma enum
  let mappedUrgency: "NORMAL" | "HIGH" | "CRITICAL" = "NORMAL";
  if (urgency) {
    const u = urgency.toUpperCase();
    if (u === "CRITICAL" || u === "HIGH" || u === "NORMAL") {
      mappedUrgency = u as any;
    }
  }

  // Map Drizzle status ("open" / "on_hold" / "closed" / "cancelled") to Prisma enum
  let mappedStatus: "OPEN" | "ON_HOLD" | "CLOSED" | "CANCELLED" | "DRAFT" = "OPEN";
  if (status) {
    const s = status.toUpperCase();
    if (s === "OPEN" || s === "ON_HOLD" || s === "CLOSED" || s === "CANCELLED" || s === "DRAFT") {
      mappedStatus = s as any;
    }
  }

  try {
    const newJob = await prisma.job.create({
      data: {
        tenantId,
        companyId,
        code,
        title,
        location,
        jobType: jobType || "full_time",
        urgency: mappedUrgency,
        salaryBand,
        jdText,
        openingsCount: openingsCount || 1,
        status: mappedStatus,
        deadline: deadline ? new Date(deadline) : undefined,
        recruiterId: recruiterId || req.user?.userId,
      },
    });

    res.status(201).json(newJob);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/requirements/:id", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const job = await prisma.job.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            website: true,
            gstin: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!job) {
      res.status(404).json({ error: "Requirement not found" });
      return;
    }

    // Get stage counts
    const stageCounts = await prisma.candidatePipeline.groupBy({
      by: ["stage"],
      where: {
        jobId: id,
        tenantId,
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    const stageCountMap: Record<string, number> = {};
    stageCounts.forEach((s) => {
      stageCountMap[s.stage.toLowerCase()] = s._count.id;
    });

    res.json({
      id: job.id,
      companyId: job.companyId,
      recruiterId: job.recruiterId,
      title: job.title,
      location: job.location,
      jobType: job.jobType,
      urgency: job.urgency.toLowerCase(),
      salaryBand: job.salaryBand,
      jdText: job.jdText,
      openingsCount: job.openingsCount,
      status: job.status.toLowerCase(),
      deadline: job.deadline,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      company: job.company,
      stageCounts: stageCountMap,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/requirements/:id", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { title, location, jobType, urgency, salaryBand, jdText, openingsCount, status, deadline } = req.body;

  const data: any = {};
  if (title !== undefined) data.title = title;
  if (location !== undefined) data.location = location;
  if (jobType !== undefined) data.jobType = jobType;
  if (urgency !== undefined) data.urgency = urgency.toUpperCase();
  if (salaryBand !== undefined) data.salaryBand = salaryBand;
  if (jdText !== undefined) data.jdText = jdText;
  if (openingsCount !== undefined) data.openingsCount = Number(openingsCount);
  if (status !== undefined) data.status = status.toUpperCase();
  if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null;

  try {
    const updated = await prisma.job.updateMany({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      data,
    });

    if (updated.count === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const job = await prisma.job.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    res.json(job);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/requirements/:id", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    await prisma.job.updateMany({
      where: {
        id,
        tenantId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    res.sendStatus(204);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
