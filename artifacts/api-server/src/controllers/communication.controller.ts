import { Request, Response } from "express";
import { z } from "zod";
import { EmailService } from "../services/email.service";
import { WhatsAppService } from "../services/whatsapp.service";
import { SmsService } from "../services/sms.service";
import { logger } from "../config/logger";

const sendEmailSchema = z.object({
  pipelineId: z.string().uuid(),
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1),
  text: z.string().optional()
});

const sendWhatsAppSchema = z.object({
  pipelineId: z.string().uuid(),
  to: z.string().min(5),
  message: z.string().min(1),
  templateName: z.string().optional()
});

const sendSmsSchema = z.object({
  pipelineId: z.string().uuid(),
  to: z.string().min(5),
  message: z.string().min(1)
});

export const sendCustomEmail = async (req: Request, res: Response) => {
  try {
    const data = sendEmailSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    const performedById = req.user!.userId;

    await EmailService.sendCustomEmail(
      data.to,
      data.subject,
      data.html,
      data.text || data.html.replace(/<[^>]*>?/gm, ''), // fallback text
      tenantId,
      data.pipelineId,
      performedById
    );

    res.json({ success: true, message: "Email sent and logged to timeline" });
  } catch (error) {
    logger.error({ error }, "Error sending custom email");
    res.status(400).json({ error: "Failed to send email" });
  }
};

export const sendWhatsApp = async (req: Request, res: Response) => {
  try {
    const data = sendWhatsAppSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    const performedById = req.user!.userId;

    const result = await WhatsAppService.sendMessage({
      to: data.to,
      message: data.message,
      templateName: data.templateName,
      tenantId,
      pipelineId: data.pipelineId,
      performedById
    });

    res.json(result);
  } catch (error) {
    logger.error({ error }, "Error sending WhatsApp message");
    res.status(400).json({ error: "Failed to send WhatsApp message" });
  }
};

export const sendSms = async (req: Request, res: Response) => {
  try {
    const data = sendSmsSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    const performedById = req.user!.userId;

    const result = await SmsService.sendMessage({
      to: data.to,
      message: data.message,
      tenantId,
      pipelineId: data.pipelineId,
      performedById
    });

    res.json(result);
  } catch (error) {
    logger.error({ error }, "Error sending SMS message");
    res.status(400).json({ error: "Failed to send SMS message" });
  }
};
