import { logger } from "../config/logger";
import { CandidatePipeline, CandidateTimeline } from "@workspace/db-prisma";
import { prisma } from "@workspace/db-prisma";

export class WhatsAppService {
  /**
   * Send a WhatsApp message to a candidate
   * Currently mocked, but scalable to Twilio or Meta WhatsApp Cloud API.
   */
  static async sendMessage(options: {
    to: string;
    message: string;
    templateName?: string;
    tenantId: string;
    pipelineId: string;
    performedById?: string;
  }) {
    logger.info(
      { to: options.to, template: options.templateName },
      "Simulating WhatsApp message delivery"
    );

    // TODO: In a real implementation, you would call Twilio or Meta here
    // const response = await twilioClient.messages.create({ ... })

    // Log this communication event in the candidate timeline
    try {
      await prisma.candidateTimeline.create({
        data: {
          tenantId: options.tenantId,
          candidateId: await this.getCandidateId(options.pipelineId),
          eventType: "COMMUNICATION_WHATSAPP",
          title: "WhatsApp Message Sent",
          description: options.message,
          metadata: {
            to: options.to,
            template: options.templateName,
            status: "delivered"
          },
          performedById: options.performedById
        }
      });
    } catch (error) {
      logger.error({ error }, "Failed to log WhatsApp communication to timeline");
    }

    return {
      success: true,
      messageId: `wa_mock_${Date.now()}`
    };
  }

  private static async getCandidateId(pipelineId: string): Promise<string> {
    const pipeline = await prisma.candidatePipeline.findUnique({
      where: { id: pipelineId },
      select: { candidateId: true }
    });
    if (!pipeline) throw new Error("Pipeline not found");
    return pipeline.candidateId;
  }
}
