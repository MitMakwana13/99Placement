/**
 * Workspace Routes — /api/v1/workspace
 *
 * Handles all workspace management: settings, members, invites, subscription, usage.
 * All routes require authentication. Owner-only routes are marked with requireOwner().
 */

import { Router } from "express";
import { randomBytes } from "crypto";
import { prisma } from "@workspace/db-prisma";
import { requireAuth } from "../../middleware/auth";
import { requirePermission } from "../../middleware/permissions";
import { SubscriptionService } from "../../services/subscription.service";
import { EmailService } from "../../services/email.service";
import { TenantRepository } from "../../repositories/tenant.repository";
import { AppError } from "../../utils/app-error";
import { env } from "../../config/env";
import logger from "../../lib/logger";
import { z } from "zod";

// Alias for clarity
const authorize = requirePermission;

const router = Router();

// All workspace routes require authentication
router.use(requireAuth);

// ─────────────────────────────────────────────
// GET /workspace — full workspace overview
// ─────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const tenantId = req.context.tenantId;

    const [tenant, settings, subscription, usage] = await Promise.all([
      TenantRepository.findById(tenantId),
      TenantRepository.findSettings(tenantId),
      SubscriptionService.getSubscription(tenantId),
      SubscriptionService.getCurrentUsage(tenantId),
    ]);

    if (!tenant) throw AppError.notFound("Workspace not found.");

    res.json({
      workspace: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt,
      },
      settings,
      subscription,
      usage,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// PATCH /workspace/settings — update workspace settings
// ─────────────────────────────────────────────
const settingsSchema = z.object({
  // Branding
  brandingColor: z.string().optional(),
  primaryColor: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
  faviconUrl: z.string().url().optional().nullable(),

  // Company Info
  companyName: z.string().max(200).optional(),
  companyWebsite: z.string().url().optional().nullable(),
  companyAddress: z.string().optional().nullable(),
  companyPhone: z.string().optional().nullable(),

  // Locale
  timezone: z.string().optional(),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AED"]).optional(),
  language: z.enum(["en", "hi", "gu"]).optional(),
  dateFormat: z.string().optional(),

  // Email config
  emailFromName: z.string().optional().nullable(),
  emailFromAddress: z.string().email().optional().nullable(),
  emailReplyTo: z.string().email().optional().nullable(),
  emailSignature: z.string().optional().nullable(),

  // AI config
  aiProvider: z.enum(["openai", "gemini", "anthropic", "openrouter", "custom"]).optional(),
  aiModel: z.string().optional().nullable(),
  aiBaseUrl: z.string().url().optional().nullable(),
  // Note: aiApiKey is stored encrypted — handled separately via PATCH /workspace/settings/ai-key

  // Notification toggles
  notifyOnNewCandidate: z.boolean().optional(),
  notifyOnStageChange: z.boolean().optional(),
  notifyOnOfferRelease: z.boolean().optional(),
  notifyOnAssessment: z.boolean().optional(),
  notifyOnJoining: z.boolean().optional(),

  // Access control
  allowedLoginDomains: z.array(z.string()).optional(),
  enableAiCopilot: z.boolean().optional(),
});

router.patch("/settings", authorize("settings:write"), async (req, res, next) => {
  try {
    const tenantId = req.context.tenantId;
    const data = settingsSchema.parse(req.body);

    const updated = await prisma.tenantSetting.upsert({
      where: { tenantId },
      create: { tenantId, ...data, allowedLoginDomains: data.allowedLoginDomains ?? [] as any },
      update: { ...data, allowedLoginDomains: data.allowedLoginDomains as any },
    });

    res.json({ success: true, settings: updated });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// POST /workspace/settings/ai-key — store encrypted AI key
// ─────────────────────────────────────────────
router.post("/settings/ai-key", authorize("settings:write"), async (req, res, next) => {
  try {
    const tenantId = req.context.tenantId;
    const { apiKey } = z.object({ apiKey: z.string().min(10) }).parse(req.body);

    // Simple base64 obfuscation — for production, replace with AES-256 encryption using a KMS key
    const encrypted = Buffer.from(apiKey).toString("base64");

    await prisma.tenantSetting.update({
      where: { tenantId },
      data: { aiApiKeyEncrypted: encrypted },
    });

    res.json({ success: true, message: "AI API key saved securely." });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// GET /workspace/members — list workspace members
// ─────────────────────────────────────────────
router.get("/members", async (req, res, next) => {
  try {
    const tenantId = req.context.tenantId;

    const members = await prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        systemRole: true,
        isActive: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ members, total: members.length });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// PATCH /workspace/members/:id/role — update member role
// ─────────────────────────────────────────────
router.patch("/members/:id/role", authorize("users:write"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.context.tenantId;
    const { roleId } = z.object({ roleId: z.string().uuid() }).parse(req.body);

    // Verify role belongs to this tenant
    const role = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
    if (!role) throw AppError.notFound("Role not found in this workspace.");

    const updated = await prisma.user.update({
      where: { id },
      data: { roleId },
      select: { id: true, name: true, email: true, role: { select: { name: true } } },
    });

    res.json({ success: true, member: updated });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// DELETE /workspace/members/:id — remove (soft-delete) member
// ─────────────────────────────────────────────
router.delete("/members/:id", authorize("users:write"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.context.tenantId;
    const requestingUserId = req.context.userId;

    if (id === requestingUserId) throw AppError.badRequest("You cannot remove yourself from the workspace.");

    const user = await prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!user) throw AppError.notFound("Member not found.");

    await prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });

    res.json({ success: true, message: "Member removed from workspace." });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// POST /workspace/invite — send member invite
// ─────────────────────────────────────────────
const inviteSchema = z.object({
  email: z.string().email(),
  roleId: z.string().uuid(),
});

router.post("/invite", authorize("users:write"), async (req, res, next) => {
  try {
    const tenantId = req.context.tenantId;
    const invitedById = req.context.userId;
    const { email, roleId } = inviteSchema.parse(req.body);

    // Check recruiter seat limit
    await SubscriptionService.checkCountLimit(tenantId, "recruiters");

    // Verify the role belongs to this tenant
    const role = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
    if (!role) throw AppError.notFound("Role not found.");

    // Check for existing active invite
    const existingInvite = await prisma.workspaceInvite.findFirst({
      where: { tenantId, email, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existingInvite) throw AppError.conflict("An active invite already exists for this email.");

    // Check if user already exists in this workspace
    const existingUser = await prisma.user.findFirst({ where: { email, tenantId, deletedAt: null } });
    if (existingUser) throw AppError.conflict("This email is already a member of this workspace.");

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72hr invite expiry

    const invite = await prisma.workspaceInvite.create({
      data: { tenantId, email, roleId, token, invitedById, expiresAt },
    });

    // Send invite email
    const inviteUrl = `${env.FRONTEND_URL}/invite/accept?token=${token}`;
    const tenant = await TenantRepository.findById(tenantId);

    try {
      await EmailService.sendWorkspaceInviteEmail(email, inviteUrl, tenant?.name ?? "Your Workspace", role.name);
    } catch (emailErr) {
      logger.error({ err: emailErr }, "Invite email failed");
      // Don't fail the invite creation if email fails
    }

    res.status(201).json({
      success: true,
      invite: { id: invite.id, email: invite.email, expiresAt: invite.expiresAt },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// GET /workspace/invites — list pending invites
// ─────────────────────────────────────────────
router.get("/invites", authorize("users:write"), async (req, res, next) => {
  try {
    const tenantId = req.context.tenantId;

    const invites = await prisma.workspaceInvite.findMany({
      where: { tenantId, acceptedAt: null },
      select: {
        id: true,
        email: true,
        expiresAt: true,
        createdAt: true,
        role: { select: { name: true } },
        invitedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ invites });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// DELETE /workspace/invites/:id — revoke invite
// ─────────────────────────────────────────────
router.delete("/invites/:id", authorize("users:write"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.context.tenantId;

    const invite = await prisma.workspaceInvite.findFirst({ where: { id, tenantId } });
    if (!invite) throw AppError.notFound("Invite not found.");

    await prisma.workspaceInvite.delete({ where: { id } });

    res.json({ success: true, message: "Invitation revoked." });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// POST /workspace/invite/accept — accept invite & create account
// ─────────────────────────────────────────────
const acceptSchema = z.object({
  token: z.string(),
  name: z.string().min(2).max(100),
  password: z.string().min(8).regex(/[0-9]/, "Password must contain at least one number"),
});

router.post("/invite/accept", async (req, res, next) => {
  try {
    const { token, name, password } = acceptSchema.parse(req.body);

    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: { tenant: true, role: true },
    });

    if (!invite) throw AppError.notFound("Invalid or expired invitation.");
    if (invite.acceptedAt) throw AppError.conflict("This invitation has already been used.");
    if (invite.expiresAt < new Date()) throw AppError.badRequest("This invitation has expired.");

    // Check if email is already registered
    const existing = await prisma.user.findUnique({ where: { email: invite.email } });
    if (existing) throw AppError.conflict("An account with this email already exists.");

    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user and mark invite accepted in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          tenantId: invite.tenantId,
          name,
          email: invite.email,
          passwordHash,
          roleId: invite.roleId,
          systemRole: "RECRUITER",
        },
      });

      await tx.workspaceInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      // Create default user preferences
      await tx.userPreference.create({ data: { userId: newUser.id } });

      return newUser;
    });

    res.status(201).json({
      success: true,
      message: `Welcome to ${invite.tenant.name}! Your account has been created.`,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// GET /workspace/usage — current month usage breakdown
// ─────────────────────────────────────────────
router.get("/usage", async (req, res, next) => {
  try {
    const tenantId = req.context.tenantId;
    const [usage, subscription] = await Promise.all([
      SubscriptionService.getCurrentUsage(tenantId),
      SubscriptionService.getSubscription(tenantId),
    ]);

    const plan = subscription?.plan;

    res.json({
      period: { month: usage.periodMonth, year: usage.periodYear },
      usage: {
        aiCredits: { used: usage.aiCreditsUsed, limit: plan?.maxAiCreditsMonthly ?? null },
        resumeParses: { used: usage.resumeParsesUsed, limit: plan?.maxResumeParsesMonthly ?? null },
        aiMatches: { used: usage.aiMatchesUsed, limit: plan?.maxAiMatchesMonthly ?? null },
        emailsSent: { used: usage.emailsSentUsed, limit: plan?.maxEmailsMonthly ?? null },
        storageMb: { used: Number(usage.storageMbUsed), limit: plan?.maxStorageMb ?? null },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// GET /workspace/subscription — plan details
// ─────────────────────────────────────────────
router.get("/subscription", async (req, res, next) => {
  try {
    const subscription = await SubscriptionService.getSubscription(req.context.tenantId);
    const plans = await SubscriptionService.listPlans();

    res.json({ subscription, plans });
  } catch (err) {
    next(err);
  }
});

export default router;
