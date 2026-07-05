import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "@workspace/db-prisma";
import { requireAuth } from "../../middleware/auth";
import { sendSuccess, sendCreated } from "../../utils/response";
import { AppError } from "../../utils/app-error";
import { z } from "zod";

const router = Router();

const WorkflowSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  triggerEvent: z.string(),
  isActive: z.boolean().default(true),
  steps: z.array(z.object({
    order: z.number(),
    name: z.string(),
    type: z.string(),
    config: z.any()
  })).optional()
});

router.get("/", requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId } = req.context;
    if (!tenantId) throw AppError.unauthorized("Tenant context missing");

    const workflows = await prisma.workflow.findMany({
      where: { tenantId },
      include: { steps: { orderBy: { order: 'asc' } } }
    });

    sendSuccess(res, workflows);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId } = req.context;
    if (!tenantId) throw AppError.unauthorized("Tenant context missing");

    const body = WorkflowSchema.parse(req.body);

    const workflow = await prisma.workflow.create({
      data: {
        tenantId,
        name: body.name,
        description: body.description,
        triggerEvent: body.triggerEvent,
        isActive: body.isActive,
        steps: {
          create: body.steps?.map(s => ({
            order: s.order,
            name: s.name,
            type: s.type,
            config: JSON.stringify(s.config)
          })) || []
        }
      },
      include: { steps: { orderBy: { order: 'asc' } } }
    });

    sendCreated(res, workflow);
  } catch (err) {
    next(err);
  }
});

export default router;
