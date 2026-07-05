import { prisma } from "@workspace/db-prisma";
import logger from "../lib/logger";

export const WorkflowEngine = {
  /**
   * Evaluates all workflows for a given tenant and event, and executes them if active.
   */
  async triggerEvent(tenantId: string, eventName: string, payload: Record<string, any>) {
    try {
      const workflows = await prisma.workflow.findMany({
        where: {
          tenantId,
          triggerEvent: eventName,
          isActive: true
        },
        include: { steps: { orderBy: { order: 'asc' } } }
      });

      if (workflows.length === 0) return;

      for (const workflow of workflows) {
        // Create execution log
        const execution = await prisma.workflowExecution.create({
          data: {
            workflowId: workflow.id,
            status: "IN_PROGRESS",
            payload: JSON.stringify(payload)
          }
        });

        const logs: any[] = [];
        let hasFailed = false;

        for (const step of workflow.steps) {
          try {
            await this.executeStep(step, payload, tenantId);
            logs.push({ stepId: step.id, type: step.type, status: "SUCCESS" });
          } catch (err: any) {
            hasFailed = true;
            logs.push({ stepId: step.id, type: step.type, status: "FAILED", error: err.message });
            break; // Stop execution on failure
          }
        }

        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: {
            status: hasFailed ? "FAILED" : "COMPLETED",
            logs: JSON.stringify(logs),
            completedAt: new Date()
          }
        });
      }
    } catch (err: any) {
      logger.error(`Workflow Engine Error [${eventName}]: ${err.message}`);
    }
  },

  /**
   * Executes a specific workflow step
   */
  async executeStep(step: any, payload: any, tenantId: string) {
    const config = typeof step.config === 'string' ? JSON.parse(step.config) : step.config;

    switch (step.type) {
      case "SEND_EMAIL":
        logger.info(`[Workflow] Executing SEND_EMAIL for tenant ${tenantId}`);
        // In a real scenario, this would call EmailService.sendEmail(...)
        break;

      case "SEND_WHATSAPP":
        logger.info(`[Workflow] Executing SEND_WHATSAPP for tenant ${tenantId}`);
        // WhatsAppService.sendMessage(...)
        break;
        
      case "CREATE_TASK":
        logger.info(`[Workflow] Executing CREATE_TASK for tenant ${tenantId}`);
        // TaskService.createTask(...)
        break;

      default:
        logger.warn(`[Workflow] Unknown step type: ${step.type}`);
    }
  }
};
