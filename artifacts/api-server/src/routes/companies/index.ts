import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { requireAuth } from "../../middleware/auth";

const router: IRouter = Router();

router.get("/companies", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const { search, limit = "50", offset = "0" } = req.query;

  const where: any = {
    tenantId,
    deletedAt: null,
  };

  if (search && typeof search === "string") {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  try {
    const rows = await prisma.company.findMany({
      where,
      take: Number(limit),
      skip: Number(offset),
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(rows);
  } catch (err: any) {
    console.error("Error fetching companies:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/companies", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const { name, industry, website, gstin } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  try {
    const company = await prisma.company.create({
      data: {
        tenantId,
        name,
        industry,
        website,
        gstin,
      },
    });
    res.status(201).json(company);
  } catch (err: any) {
    console.error("Error creating company:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/companies/:id", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const company = await prisma.company.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    res.json(company);
  } catch (err: any) {
    console.error("Error fetching company details:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/companies/:id", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, industry, website, gstin } = req.body;

  try {
    const company = await prisma.company.update({
      where: {
        id,
        tenantId,
      },
      data: {
        name,
        industry,
        website,
        gstin,
        updatedAt: new Date(),
      },
    });

    res.json(company);
  } catch (err: any) {
    console.error("Error updating company:", err);
    res.status(404).json({ error: "Company not found" });
  }
});

router.get("/companies/:id/contacts", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  try {
    const contacts = await prisma.companyContact.findMany({
      where: {
        companyId: id,
        tenantId,
        deletedAt: null,
      },
    });
    res.json(contacts);
  } catch (err: any) {
    console.error("Error fetching company contacts:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/companies/:id/contacts", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const companyId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, email, phone, designation, isPrimary } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  try {
    const contact = await prisma.companyContact.create({
      data: {
        tenantId,
        companyId,
        name,
        email,
        phone,
        designation,
        isPrimary: !!isPrimary,
      },
    });
    res.status(201).json(contact);
  } catch (err: any) {
    console.error("Error creating company contact:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
