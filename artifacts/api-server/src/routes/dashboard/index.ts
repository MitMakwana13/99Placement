import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  requirementsTable,
  candidatePipelineTable,
  clientInterviewsTable,
  offerLettersTable,
  joiningStatusTable,
} from "@workspace/db/schema";
import { eq, isNull, and, gte, lte, sql, count } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayStart.getDate() + 1);

  const [openReqs] = await db
    .select({ count: count() })
    .from(requirementsTable)
    .where(and(eq(requirementsTable.status, "open"), isNull(requirementsTable.deletedAt)));

  const [activeCandidates] = await db
    .select({ count: count() })
    .from(candidatePipelineTable);

  const [weekInterviews] = await db
    .select({ count: count() })
    .from(clientInterviewsTable)
    .where(and(gte(clientInterviewsTable.scheduledAt, weekStart), lte(clientInterviewsTable.scheduledAt, weekEnd)));

  const [pendingOffers] = await db
    .select({ count: count() })
    .from(offerLettersTable)
    .where(eq(offerLettersTable.status, "sent"));

  const [joiningToday] = await db
    .select({ count: count() })
    .from(joiningStatusTable)
    .where(and(gte(joiningStatusTable.joiningDate, todayStart), lte(joiningStatusTable.joiningDate, todayEnd)));

  res.json({
    openRequirements: openReqs.count,
    candidatesInPipeline: activeCandidates.count,
    interviewsThisWeek: weekInterviews.count,
    offersPending: pendingOffers.count,
    joiningToday: joiningToday.count,
    avgTimeTofillDays: 21,
  });
});

router.get("/dashboard/pipeline-funnel", requireAuth, async (req, res): Promise<void> => {
  const stageCounts = await db
    .select({ stage: candidatePipelineTable.stage, count: count() })
    .from(candidatePipelineTable)
    .groupBy(candidatePipelineTable.stage);

  const labels: Record<string, string> = {
    sourced: "Candidate Sourcing",
    screened: "99 Screening",
    assessed: "99 Assessment",
    shortlisted: "Shortlisted",
    client_interview: "Client Interview",
    offer: "Offer",
    joining: "Joining",
    post_joining: "Post Joining",
    rejected: "Rejected",
    dropped: "Dropped",
  };

  const total = stageCounts.reduce((sum, s) => sum + Number(s.count), 0) || 1;

  const funnel = ["sourced", "screened", "assessed", "shortlisted", "client_interview", "offer", "joining"].map(stage => {
    const found = stageCounts.find(s => s.stage === stage);
    const count2 = found ? Number(found.count) : 0;
    return {
      stage,
      label: labels[stage] || stage,
      count: count2,
      pct: Math.round((count2 / total) * 100),
    };
  });

  res.json(funnel);
});

export default router;
