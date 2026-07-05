import { prisma } from "@workspace/db-prisma";
import { IEventHandler } from "../domain-event";
import {
  AssessmentAssignedEvent,
  AssessmentStartedEvent,
  AssessmentSubmittedEvent,
  AssessmentEvaluatedEvent,
} from "./assessment.events";
import logger from "../../lib/logger";

function cleanUuid(id: string | null | undefined): string | null {
  if (!id) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id) ? id : null;
}

async function getRecipientId(tenantId: string, testId: string, performedById: string): Promise<string> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(performedById)) {
    return performedById;
  }
  
  const test = await prisma.assessmentTest.findUnique({
    where: { id: testId },
    select: {
      conductedById: true,
      pipeline: {
        select: {
          assignedRecruiterId: true,
        },
      },
    },
  });
  
  if (test?.conductedById && uuidRegex.test(test.conductedById)) {
    return test.conductedById;
  }
  if (test?.pipeline?.assignedRecruiterId && uuidRegex.test(test.pipeline.assignedRecruiterId)) {
    return test.pipeline.assignedRecruiterId;
  }
  
  const firstUser = await prisma.user.findFirst({
    where: { tenantId },
    select: { id: true },
  });
  
  return firstUser?.id || performedById;
}

// ─────────────────────────────────────────────────────────────────────────────
// AssessmentAssigned Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class AssessmentAssignedTimelineHandler implements IEventHandler<AssessmentAssignedEvent> {
  async handle(event: AssessmentAssignedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Assessment Test Assigned",
        description: `Assessment test (Attempt #${event.attemptNumber}) assigned to candidate.`,
        performedById: cleanUuid(event.performedById),
        metadata: { testId: event.testId, pipelineId: event.pipelineId, attemptNumber: event.attemptNumber },
      },
    });

    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "ASSESSMENT_ASSIGNED",
        title: "Assessment Assigned",
        description: `Test attempt #${event.attemptNumber} assigned.`,
        performedById: cleanUuid(event.performedById),
        metadata: { testId: event.testId },
      },
    });
  }
}

export class AssessmentAssignedAuditHandler implements IEventHandler<AssessmentAssignedEvent> {
  async handle(event: AssessmentAssignedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "ASSESSMENT",
        entityId: event.testId,
        action: "ASSIGN",
        performedById: cleanUuid(event.performedById),
        metadata: { pipelineId: event.pipelineId, attemptNumber: event.attemptNumber },
      },
    });
  }
}

export class AssessmentAssignedNotificationHandler implements IEventHandler<AssessmentAssignedEvent> {
  async handle(event: AssessmentAssignedEvent): Promise<void> {
    const recipientId = await getRecipientId(event.tenantId, event.testId, event.performedById);
    await prisma.notification.create({
      data: {
        tenantId: event.tenantId,
        recipientId,
        type: "SYSTEM_ALERT",
        title: "Assessment Assigned",
        body: `Assessment test assigned for candidate. Attempt #${event.attemptNumber}.`,
        entityType: "ASSESSMENT",
        entityId: event.testId,
      },
    });
  }
}

import { EmailService } from "../../services/email.service";

export class AssessmentAssignedEmailHandler implements IEventHandler<AssessmentAssignedEvent> {
  async handle(event: AssessmentAssignedEvent): Promise<void> {
    try {
      const test = await prisma.assessmentTest.findUnique({
        where: { id: event.testId },
        include: {
          pipeline: {
            include: {
              candidate: true,
            },
          },
        },
      });

      if (!test || !test.pipeline?.candidate) {
        logger.error(`AssessmentAssignedEmailHandler: Test or Candidate not found for testId=${event.testId}`);
        return;
      }

      const candidate = test.pipeline.candidate;
      let testName = "Skill Assessment";

      if (test.templateId) {
        const template = await prisma.assessmentTemplate.findUnique({
          where: { id: test.templateId },
        });
        if (template) {
          testName = template.name;
        }
      }

      const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
      const inviteUrl = `${clientUrl}/assessment/take/${test.id}`;

      logger.info(`Sending assessment email to candidate: ${candidate.email} for test ${testName}`);
      
      await EmailService.sendAssessmentInviteEmail(candidate.email, {
        candidateName: candidate.name,
        testName,
        inviteUrl,
      });
    } catch (err: any) {
      logger.error(`AssessmentAssignedEmailHandler Error: ${err.message}`);
    }
  }
}

export class AssessmentAssignedAnalyticsHandler implements IEventHandler<AssessmentAssignedEvent> {
  async handle(event: AssessmentAssignedEvent): Promise<void> {
    logger.info(`Analytics: [${event.eventName}] testId=${event.testId} attempt=${event.attemptNumber}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AssessmentStarted Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class AssessmentStartedTimelineHandler implements IEventHandler<AssessmentStartedEvent> {
  async handle(event: AssessmentStartedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Assessment Test Started",
        description: `Candidate started the assessment test at ${event.startedAt.toISOString()}.`,
        performedById: cleanUuid(event.performedById),
        metadata: { testId: event.testId, pipelineId: event.pipelineId, startedAt: event.startedAt },
      },
    });

    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "ASSESSMENT_STARTED",
        title: "Assessment Started",
        description: `Timed assessment started by candidate.`,
        performedById: cleanUuid(event.performedById),
        metadata: { testId: event.testId },
      },
    });
  }
}

export class AssessmentStartedAuditHandler implements IEventHandler<AssessmentStartedEvent> {
  async handle(event: AssessmentStartedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "ASSESSMENT",
        entityId: event.testId,
        action: "START",
        performedById: cleanUuid(event.performedById),
        metadata: { startedAt: event.startedAt },
      },
    });
  }
}

export class AssessmentStartedNotificationHandler implements IEventHandler<AssessmentStartedEvent> {
  async handle(event: AssessmentStartedEvent): Promise<void> {
    logger.info(`Notification: Candidate started test [${event.testId}]`);
  }
}

export class AssessmentStartedAnalyticsHandler implements IEventHandler<AssessmentStartedEvent> {
  async handle(event: AssessmentStartedEvent): Promise<void> {
    logger.info(`Analytics: [${event.eventName}] testId=${event.testId}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AssessmentSubmitted Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class AssessmentSubmittedTimelineHandler implements IEventHandler<AssessmentSubmittedEvent> {
  async handle(event: AssessmentSubmittedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: "Assessment Test Submitted",
        description: `Candidate submitted the assessment test at ${event.submittedAt.toISOString()}.`,
        performedById: cleanUuid(event.performedById),
        metadata: { testId: event.testId, pipelineId: event.pipelineId, submittedAt: event.submittedAt },
      },
    });

    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "ASSESSMENT_SUBMITTED",
        title: "Assessment Submitted",
        description: `Candidate completed questions and submitted test.`,
        performedById: cleanUuid(event.performedById),
        metadata: { testId: event.testId },
      },
    });
  }
}

export class AssessmentSubmittedAuditHandler implements IEventHandler<AssessmentSubmittedEvent> {
  async handle(event: AssessmentSubmittedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "ASSESSMENT",
        entityId: event.testId,
        action: "SUBMIT",
        performedById: cleanUuid(event.performedById),
        metadata: { submittedAt: event.submittedAt },
      },
    });
  }
}

export class AssessmentSubmittedNotificationHandler implements IEventHandler<AssessmentSubmittedEvent> {
  async handle(event: AssessmentSubmittedEvent): Promise<void> {
    logger.info(`Notification: Candidate submitted test [${event.testId}]`);
  }
}

export class AssessmentSubmittedAnalyticsHandler implements IEventHandler<AssessmentSubmittedEvent> {
  async handle(event: AssessmentSubmittedEvent): Promise<void> {
    logger.info(`Analytics: [${event.eventName}] testId=${event.testId}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AssessmentEvaluated Handlers
// ─────────────────────────────────────────────────────────────────────────────

export class AssessmentEvaluatedTimelineHandler implements IEventHandler<AssessmentEvaluatedEvent> {
  async handle(event: AssessmentEvaluatedEvent): Promise<void> {
    await prisma.candidateTimeline.create({
      data: {
        tenantId: event.tenantId,
        candidateId: event.candidateId,
        eventType: event.eventName,
        title: `Assessment Evaluated: ${event.verdict}`,
        description: `Assessment test graded. Score: ${event.score}/${event.maxScore} (${event.percentage}%). Verdict: ${event.verdict}.`,
        performedById: cleanUuid(event.performedById),
        metadata: {
          testId: event.testId,
          pipelineId: event.pipelineId,
          score: event.score,
          maxScore: event.maxScore,
          percentage: event.percentage,
          verdict: event.verdict,
        },
      },
    });

    await prisma.pipelineActivity.create({
      data: {
        tenantId: event.tenantId,
        pipelineId: event.pipelineId,
        activityType: "ASSESSMENT_COMPLETED",
        title: "Assessment Evaluated",
        description: `Graded: ${event.percentage}% (${event.verdict}).`,
        performedById: cleanUuid(event.performedById),
        metadata: { testId: event.testId, score: event.score, percentage: event.percentage, verdict: event.verdict },
      },
    });
  }
}

export class AssessmentEvaluatedAuditHandler implements IEventHandler<AssessmentEvaluatedEvent> {
  async handle(event: AssessmentEvaluatedEvent): Promise<void> {
    await prisma.activityLog.create({
      data: {
        tenantId: event.tenantId,
        entityType: "ASSESSMENT",
        entityId: event.testId,
        action: "EVALUATE",
        performedById: cleanUuid(event.performedById),
        metadata: {
          pipelineId: event.pipelineId,
          score: event.score,
          maxScore: event.maxScore,
          percentage: event.percentage,
          verdict: event.verdict,
        },
      },
    });
  }
}

export class AssessmentEvaluatedNotificationHandler implements IEventHandler<AssessmentEvaluatedEvent> {
  async handle(event: AssessmentEvaluatedEvent): Promise<void> {
    const recipientId = await getRecipientId(event.tenantId, event.testId, event.performedById);
    await prisma.notification.create({
      data: {
        tenantId: event.tenantId,
        recipientId,
        type: "SYSTEM_ALERT",
        title: `Assessment Test Evaluated (${event.verdict})`,
        body: `Candidate scored ${event.percentage}% on the assessment test. Verdict: ${event.verdict}.`,
        entityType: "ASSESSMENT",
        entityId: event.testId,
      },
    });
  }
}

export class AssessmentEvaluatedAnalyticsHandler implements IEventHandler<AssessmentEvaluatedEvent> {
  async handle(event: AssessmentEvaluatedEvent): Promise<void> {
    logger.info(`Analytics: [${event.eventName}] testId=${event.testId} pct=${event.percentage}% verdict=${event.verdict}`);
  }
}
