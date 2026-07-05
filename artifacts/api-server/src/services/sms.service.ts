import { logger } from "../config/logger";
import { prisma } from "@workspace/db-prisma";

export class SmsService {
  /**
   * Send an SMS message to a candidate
   * Currently mocked.
   */
  static async sendMessage(options: {
    to: string;
    message: string;
    tenantId: string;
    pipelineId: string;
    performedById?: string;
  }) {
    logger.info(
      { to: options.to },
      "Simulating SMS message delivery"
    );

    try {
      await prisma.candidateTimeline.create({
        data: {
          tenantId: options.tenantId,
          candidateId: await this.getCandidateId(options.pipelineId),
          eventType: "COMMUNICATION_SMS",
          title: "SMS Message Sent",
          description: options.message,
          metadata: {
            to: options.to,
            status: "delivered"
          },
          performedById: options.performedById
        }
      });
    } catch (error) {
      logger.error({ error }, "Failed to log SMS communication to timeline");
    }

    return {
      success: true,
      messageId: `sms_mock_${Date.now()}`
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
