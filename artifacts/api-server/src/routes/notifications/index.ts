import { Router, type IRouter } from "express";
import { prisma } from "@workspace/db-prisma";
import { requireAuth } from "../../middleware/auth";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const { unreadOnly } = req.query;
  const recipientId = req.employee?.employeeId || req.user?.userId;

  if (!recipientId) {
    res.status(400).json({ error: "Recipient identity not found" });
    return;
  }

  const where: any = {
    tenantId,
    recipientId,
  };

  if (unreadOnly === "true") {
    where.isRead = false;
  }

  try {
    const rows = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
      take: 50,
    });

    res.json(rows);
  } catch (err: any) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const recipientId = req.employee?.employeeId || req.user?.userId;

  if (!recipientId) {
    res.status(400).json({ error: "Recipient identity not found" });
    return;
  }

  try {
    const notification = await prisma.notification.update({
      where: {
        id,
        tenantId,
        recipientId,
      },
      data: {
        isRead: true,
      },
    });

    res.json(notification);
  } catch (err: any) {
    console.error("Error reading notification:", err);
    res.status(404).json({ error: "Notification not found" });
  }
});

router.patch("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(401).json({ error: "Tenant isolation context missing." });
    return;
  }

  const recipientId = req.employee?.employeeId || req.user?.userId;

  if (!recipientId) {
    res.status(400).json({ error: "Recipient identity not found" });
    return;
  }

  try {
    await prisma.notification.updateMany({
      where: {
        tenantId,
        recipientId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.sendStatus(204);
  } catch (err: any) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
