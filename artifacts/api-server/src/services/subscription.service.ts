/**
 * SubscriptionService — SaaS Plan management, usage tracking, and limit enforcement.
 *
 * Architecture decisions:
 * - Plans are DB-driven (no hardcoded limits anywhere)
 * - Usage is tracked per-month per-tenant (atomic increments via UPDATE ... RETURNING)
 * - Limit checks return structured errors for the middleware to serialize
 * - seedDefaultPlans() is idempotent — safe to call on every app boot
 */

import { prisma } from "@workspace/db-prisma";
import { AppError } from "../utils/app-error";
import logger from "../lib/logger";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

export type UsageMetric =
  | "ai_credits"
  | "resume_parses"
  | "ai_matches"
  | "emails_sent"
  | "storage_mb";

export type CountableResource =
  | "recruiters"
  | "candidates"
  | "companies"
  | "jobs"
  | "assessments"
  | "active_pipelines";

interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number | null; // null = unlimited
  metric: string;
}

// ────────────────────────────────────────────────
// Default plan definitions (for seeding only)
// ────────────────────────────────────────────────

const DEFAULT_PLANS = [
  {
    name: "FREE",
    displayName: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    maxRecruiters: 2,
    maxCandidates: 100,
    maxCompanies: 10,
    maxJobs: 5,
    maxStorageMb: 500,
    maxAiCreditsMonthly: 50,
    maxAssessments: 20,
    maxActivePipelines: 20,
    maxResumeParsesMonthly: 10,
    maxAiMatchesMonthly: 10,
    maxEmailsMonthly: 100,
    features: {
      clientPortal: false,
      candidatePortal: false,
      customBranding: false,
      apiAccess: false,
      advancedAnalytics: false,
    },
  },
  {
    name: "STARTER",
    displayName: "Starter",
    priceMonthly: 2999,
    priceYearly: 29990,
    maxRecruiters: 5,
    maxCandidates: 1000,
    maxCompanies: 50,
    maxJobs: 25,
    maxStorageMb: 2048,
    maxAiCreditsMonthly: 500,
    maxAssessments: 200,
    maxActivePipelines: 100,
    maxResumeParsesMonthly: 100,
    maxAiMatchesMonthly: 100,
    maxEmailsMonthly: 1000,
    features: {
      clientPortal: true,
      candidatePortal: false,
      customBranding: true,
      apiAccess: false,
      advancedAnalytics: false,
    },
  },
  {
    name: "PROFESSIONAL",
    displayName: "Professional",
    priceMonthly: 9999,
    priceYearly: 99990,
    maxRecruiters: 20,
    maxCandidates: 10000,
    maxCompanies: 500,
    maxJobs: 200,
    maxStorageMb: 20480,
    maxAiCreditsMonthly: 2000,
    maxAssessments: 2000,
    maxActivePipelines: 500,
    maxResumeParsesMonthly: 500,
    maxAiMatchesMonthly: 500,
    maxEmailsMonthly: 5000,
    features: {
      clientPortal: true,
      candidatePortal: true,
      customBranding: true,
      apiAccess: true,
      advancedAnalytics: true,
    },
  },
  {
    name: "ENTERPRISE",
    displayName: "Enterprise",
    priceMonthly: 0,
    priceYearly: 0,
    maxRecruiters: null,
    maxCandidates: null,
    maxCompanies: null,
    maxJobs: null,
    maxStorageMb: null,
    maxAiCreditsMonthly: null,
    maxAssessments: null,
    maxActivePipelines: null,
    maxResumeParsesMonthly: null,
    maxAiMatchesMonthly: null,
    maxEmailsMonthly: null,
    features: {
      clientPortal: true,
      candidatePortal: true,
      customBranding: true,
      apiAccess: true,
      advancedAnalytics: true,
    },
  },
];

// ────────────────────────────────────────────────
// Service
// ────────────────────────────────────────────────

export class SubscriptionService {
  /**
   * Idempotent plan seeder — safe to call on every app boot.
   */
  static async seedDefaultPlans(): Promise<void> {
    for (const plan of DEFAULT_PLANS) {
      await prisma.subscriptionPlan.upsert({
        where: { name: plan.name },
        create: {
          ...plan,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          features: plan.features as any,
        },
        update: {
          displayName: plan.displayName,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          features: plan.features as any,
        },
      });
    }
    logger.info("Subscription plans seeded successfully");
  }

  /**
   * Provisions a new tenant onto the FREE plan with a 14-day trial.
   * Called by AuthService.registerTenant() within its transaction.
   */
  static async provisionTrial(tenantId: string, tx?: any): Promise<void> {
    const db = tx ?? prisma;

    const freePlan = await db.subscriptionPlan.findUnique({
      where: { name: "FREE" },
    });

    if (!freePlan) {
      logger.warn("FREE plan not found — skipping trial provisioning. Run seedDefaultPlans().");
      return;
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    await db.tenantSubscription.create({
      data: {
        tenantId,
        planId: freePlan.id,
        status: "TRIAL",
        trialEndsAt: trialEnd,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  /**
   * Returns the current subscription with plan and limits for a tenant.
   */
  static async getSubscription(tenantId: string) {
    const subscription = await prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription) {
      // Gracefully return a FREE-like fallback if no subscription exists yet
      const freePlan = await prisma.subscriptionPlan.findUnique({ where: { name: "FREE" } });
      return { status: "TRIAL", plan: freePlan };
    }

    return subscription;
  }

  /**
   * Returns or initializes the current month's usage record for a tenant.
   */
  static async getCurrentUsage(tenantId: string) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    return prisma.tenantUsage.upsert({
      where: { tenantId_periodMonth_periodYear: { tenantId, periodMonth: month, periodYear: year } },
      create: { tenantId, periodMonth: month, periodYear: year },
      update: {},
    });
  }

  /**
   * Atomically increments a monthly usage counter.
   */
  static async incrementUsage(
    tenantId: string,
    metric: UsageMetric,
    amount: number = 1
  ): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const fieldMap: Record<UsageMetric, string> = {
      ai_credits: "aiCreditsUsed",
      resume_parses: "resumeParsesUsed",
      ai_matches: "aiMatchesUsed",
      emails_sent: "emailsSentUsed",
      storage_mb: "storageMbUsed",
    };

    const field = fieldMap[metric];

    await prisma.tenantUsage.upsert({
      where: { tenantId_periodMonth_periodYear: { tenantId, periodMonth: month, periodYear: year } },
      create: { tenantId, periodMonth: month, periodYear: year, [field]: amount },
      update: { [field]: { increment: amount } },
    });
  }

  /**
   * Checks whether a resource count limit would be exceeded.
   * Throws 402 Payment Required if limit reached.
   */
  static async checkCountLimit(
    tenantId: string,
    resource: CountableResource
  ): Promise<LimitCheckResult> {
    const subscription = await this.getSubscription(tenantId);
    const plan = subscription?.plan;

    if (!plan) return { allowed: true, current: 0, limit: null, metric: resource };

    const limitMap: Record<CountableResource, number | null | undefined> = {
      recruiters: plan.maxRecruiters,
      candidates: plan.maxCandidates,
      companies: plan.maxCompanies,
      jobs: plan.maxJobs,
      assessments: plan.maxAssessments,
      active_pipelines: plan.maxActivePipelines,
    };

    const limit = limitMap[resource] ?? null;
    if (limit === null) return { allowed: true, current: 0, limit: null, metric: resource };

    // Count current records
    const countMap: Record<CountableResource, () => Promise<number>> = {
      recruiters: () => prisma.user.count({ where: { tenantId, deletedAt: null } }),
      candidates: () => prisma.candidate.count({ where: { tenantId, deletedAt: null } }),
      companies: () => prisma.company.count({ where: { tenantId, deletedAt: null } }),
      jobs: () => prisma.job.count({ where: { tenantId, deletedAt: null } }),
      assessments: () => prisma.assessmentTest.count({ where: { tenantId } }),
      active_pipelines: () =>
        prisma.candidatePipeline.count({
          where: { tenantId, status: { notIn: ["REJECTED", "WITHDRAWN", "ON_HOLD"] } },
        }),
    };

    const current = await countMap[resource]();

    if (current >= limit) {
      throw AppError.paymentRequired(
        `You have reached your ${resource} limit (${limit}) on the ${plan.displayName} plan. Please upgrade to add more.`,
        "USAGE_LIMIT_EXCEEDED",
        { resource, current, limit, plan: plan.name, upgradeUrl: "/dashboard/settings/billing" }
      );
    }

    return { allowed: true, current, limit, metric: resource };
  }

  /**
   * Checks monthly usage metric limits.
   */
  static async checkUsageLimit(
    tenantId: string,
    metric: UsageMetric
  ): Promise<LimitCheckResult> {
    const [subscription, usage] = await Promise.all([
      this.getSubscription(tenantId),
      this.getCurrentUsage(tenantId),
    ]);

    const plan = subscription?.plan;
    if (!plan) return { allowed: true, current: 0, limit: null, metric };

    const limitMap: Record<UsageMetric, number | null | undefined> = {
      ai_credits: plan.maxAiCreditsMonthly,
      resume_parses: plan.maxResumeParsesMonthly,
      ai_matches: plan.maxAiMatchesMonthly,
      emails_sent: plan.maxEmailsMonthly,
      storage_mb: plan.maxStorageMb,
    };

    const currentMap: Record<UsageMetric, number> = {
      ai_credits: usage.aiCreditsUsed,
      resume_parses: usage.resumeParsesUsed,
      ai_matches: usage.aiMatchesUsed,
      emails_sent: usage.emailsSentUsed,
      storage_mb: Number(usage.storageMbUsed),
    };

    const limit = limitMap[metric] ?? null;
    const current = currentMap[metric];

    if (limit !== null && current >= limit) {
      throw AppError.paymentRequired(
        `You have reached your monthly ${metric.replace("_", " ")} limit (${limit}) on the ${plan.displayName} plan. Please upgrade.`,
        "MONTHLY_LIMIT_EXCEEDED",
        { metric, current, limit, plan: plan.name, upgradeUrl: "/dashboard/settings/billing" }
      );
    }

    return { allowed: true, current, limit, metric };
  }

  /**
   * Returns all plans (for billing page comparison table).
   */
  static async listPlans() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    });
  }
}
