import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { prisma, User, Tenant, Role } from "@workspace/db-prisma";
import { LoginInput, RegisterTenantInput } from "@workspace/shared-schemas";
import { ChangePasswordInput, UpdateProfileInput } from "../validators/auth.validator";
import { signAccessToken, signRefreshToken, verifyRefreshToken, JwtPayload } from "../utils/jwt";
import { UserRepository } from "../repositories/user.repository";
import { TenantRepository } from "../repositories/tenant.repository";
import { SessionRepository } from "../repositories/session.repository";
import { RbacService } from "./rbac.service";
import { AppError } from "../utils/app-error";
import logger from "../lib/logger";

export class AuthService {
  /**
   * Helper function to hash a plain refresh token using SHA-256
   */
  private static hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  /**
   * Onboards a new placement consultancy (Tenant), generates default security roles,
   * hashes admin password, and sets up primary User and UserPreference records.
   */
  static async registerTenant(input: RegisterTenantInput): Promise<{ tenantId: string; userId: string; email: string }> {
    const existingUser = await UserRepository.findByEmail(input.adminEmail);
    if (existingUser) {
      throw AppError.conflict("Admin email is already registered.", "EMAIL_ALREADY_EXISTS");
    }

    const existingTenant = await TenantRepository.findBySlug(input.tenantSlug);
    if (existingTenant) {
      throw AppError.conflict("Tenant slug is already taken.", "SLUG_ALREADY_EXISTS");
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.adminPassword, salt);

    // Seed permissions globally before transaction
    await RbacService.seedPermissions();

    // Coordinate transaction across repository boundaries atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          slug: input.tenantSlug,
        },
      });

      // 2. Initialize default Tenant Settings
      await tx.tenantSetting.create({
        data: {
          tenantId: tenant.id,
        },
      });

      // 3. Initialize Tenant dynamic roles and standard permission sets
      const roles = await RbacService.initializeTenantRoles(tenant.id, tx);
      const adminRole = roles["TENANT_ADMIN"] as Role;

      // 4. Create Tenant Admin user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          roleId: adminRole.id,
          name: input.adminName,
          email: input.adminEmail,
          passwordHash,
          systemRole: "TENANT_ADMIN",
        },
      });

      // 5. Initialize user preferences
      await tx.userPreference.create({
        data: {
          userId: user.id,
          theme: "light",
        },
      });

      return { tenant, user };
    });

    logger.info({ tenantId: result.tenant.id, userId: result.user.id }, "Tenant registered successfully");

    return {
      tenantId: result.tenant.id,
      userId: result.user.id,
      email: result.user.email,
    };
  }

  /**
   * Authenticates standard user credentials and registers session token tracking
   */
  static async login(
    input: LoginInput,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const user = await UserRepository.findByEmail(input.email);
    if (!user || !user.isActive || user.deletedAt) {
      throw AppError.unauthorized("Invalid email or password credentials.", "INVALID_CREDENTIALS");
    }

    // Tenant check
    if (!user.tenant.isActive || user.tenant.deletedAt) {
      throw AppError.forbidden("Tenant workspace is suspended or archived.", "TENANT_INACTIVE");
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw AppError.unauthorized("Invalid email or password credentials.", "INVALID_CREDENTIALS");
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      systemRole: user.systemRole,
      tenantId: user.tenantId,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    const refreshTokenHash = this.hashToken(refreshToken);

    // Register refresh token session tracker
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7); // match jwt token expiration (7 days)

    await SessionRepository.create(user.id, refreshTokenHash, expirationDate, ipAddress, userAgent);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        systemRole: user.systemRole,
        tenantId: user.tenantId,
        companyId: user.companyId,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Validates refresh token rotation and handles reuse security breaches
   */
  static async refreshSession(
    token: string,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(token);
    } catch (err) {
      throw AppError.unauthorized("Expired or corrupted session.", "EXPIRED_REFRESH_TOKEN");
    }

    const tokenHash = this.hashToken(token);
    const session = await SessionRepository.findByTokenHash(tokenHash);

    // Detection of Token Reuse Breach!
    if (!session) {
      // If a valid refresh token is used but no active tracker matches, it indicates token theft.
      // Automatically purge all active sessions for the user as a safety fallback.
      await SessionRepository.deleteByUserId(payload.userId);
      logger.warn({ userId: payload.userId }, "Breach Alert: Refresh token reuse detected. Revoked all device sessions.");
      throw AppError.forbidden("Security alert: Revoked all user sessions due to reuse attempt.", "TOKEN_REUSE_DETECTED");
    }

    // Invalidate the old session tracker (RTR rotation step)
    await SessionRepository.deleteById(session.id);

    // Double check account active bounds
    const user = session.user;
    if (!user || !user.isActive || user.deletedAt) {
      throw AppError.unauthorized("User account has been disabled.", "USER_INACTIVE");
    }

    // Generate new payload claims and issue fresh tokens
    const newClaims: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      systemRole: user.systemRole,
      tenantId: user.tenantId,
    };

    const newAccessToken = signAccessToken(newClaims);
    const newRefreshToken = signRefreshToken(newClaims);
    const newHash = this.hashToken(newRefreshToken);

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    // Save the rotated token state
    await SessionRepository.create(user.id, newHash, expirationDate, ipAddress, userAgent);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Invalidates a specific session refresh token on logout
   */
  static async logout(refreshToken: string): Promise<void> {
    const hash = this.hashToken(refreshToken);
    const session = await SessionRepository.findByTokenHash(hash);
    if (session) {
      await SessionRepository.deleteById(session.id);
    }
  }

  /**
   * Revokes all active sessions for a user across all devices
   */
  static async logoutAllDevices(userId: string): Promise<void> {
    await SessionRepository.deleteByUserId(userId);
  }

  /**
   * Retrieves active profile properties for logged-in users
   */
  static async getCurrentUser(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user || user.deletedAt) {
      throw AppError.notFound("User profile not found.", "USER_NOT_FOUND");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      systemRole: user.systemRole,
      tenantId: user.tenantId,
      companyId: user.companyId,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  /**
   * Modifies account information
   */
  static async updateProfile(userId: string, input: UpdateProfileInput) {
    const dataToUpdate: any = {};
    if (input.name) dataToUpdate.name = input.name;

    if (input.email) {
      const emailUser = await UserRepository.findByEmail(input.email);
      if (emailUser && emailUser.id !== userId) {
        throw AppError.conflict("Email address already registered.", "EMAIL_ALREADY_EXISTS");
      }
      dataToUpdate.email = input.email;
    }

    const user = await UserRepository.update(userId, dataToUpdate);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  /**
   * Changes account credentials
   */
  static async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found.", "USER_NOT_FOUND");
    }

    const isMatch = await bcrypt.compare(input.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw AppError.unauthorized("Incorrect old password credential.", "INCORRECT_OLD_PASSWORD");
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.newPassword, salt);

    await UserRepository.update(userId, { passwordHash });
  }

  /**
   * Simulates/Mocks a request to send a recovery link to the user
   */
  static async forgotPassword(email: string): Promise<void> {
    const user = await UserRepository.findByEmail(email);
    // Protect against email enumeration by returning a generic successful log signature
    if (!user) {
      logger.info({ email }, "Forgot password request processed for non-existing target user.");
      return;
    }

    // In production, generate a cryptographically secure token, write it to memory cache (Redis), and email the user.
    logger.info({ userId: user.id, email }, "Reset password instruction link generated.");
  }

  /**
   * Simulates/Mocks resetting password using a recovery token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    // In production, we'd verify the recovery token in Redis or SQL table. Here we mock a successful verify loop.
    if (token === "invalid-token" || token.length < 10) {
      throw AppError.badRequest("Invalid or expired password reset recovery token.", "INVALID_RESET_TOKEN");
    }

    // Locate the target user (e.g. using a mock tenant search or using standard parameters)
    // For demonstration, let's find the first tenant admin user
    const firstAdmin = await prisma.user.findFirst({
      where: { systemRole: "TENANT_ADMIN" },
    });

    if (!firstAdmin) {
      throw AppError.notFound("System admin user could not be located to perform reset.", "USER_NOT_FOUND");
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await UserRepository.update(firstAdmin.id, { passwordHash });
    logger.info({ userId: firstAdmin.id }, "Successfully reset password using recovery token.");
  }

  /**
   * Simulates/Mocks a verification check
   */
  static async verifyEmail(token: string): Promise<void> {
    if (token === "invalid-token" || token.length < 10) {
      throw AppError.badRequest("Invalid or expired email verification token.", "INVALID_VERIFY_TOKEN");
    }
    logger.info({ token }, "Email address successfully verified.");
  }
}
