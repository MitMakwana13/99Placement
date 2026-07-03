import bcrypt from "bcryptjs";
import { prisma, Role } from "@workspace/db-prisma";
import { LoginInput, RegisterTenantInput } from "@workspace/shared-schemas";
import { signToken } from "../middleware/auth";

export class AuthService {
  /**
   * Onboards a new consultancy (Tenant) and creates the primary Tenant Admin user.
   * Runs atomically in a database transaction.
   */
  static async registerTenant(input: RegisterTenantInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.adminEmail },
    });

    if (existingUser) {
      throw new Error("Admin email already registered.");
    }

    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: input.tenantSlug },
    });

    if (existingTenant) {
      throw new Error("Tenant slug is already taken.");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.adminPassword, salt);

    // Atomically create Tenant and User
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          slug: input.tenantSlug,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: input.adminName,
          email: input.adminEmail,
          passwordHash,
          role: Role.TENANT_ADMIN,
        },
      });

      return { tenant, user };
    });

    return {
      tenantId: result.tenant.id,
      userId: result.user.id,
      email: result.user.email,
    };
  }

  /**
   * Authenticates a user and generates a session token.
   */
  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { tenant: true },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new Error("Invalid credentials or inactive account.");
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid credentials.");
    }

    // Ensure the associated tenant is active
    if (!user.tenant.isActive) {
      throw new Error("Consultancy account is suspended. Contact support.");
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        companyId: user.companyId,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Retrieves active session details for a validated user.
   */
  static async verifySession(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        companyId: true,
        isActive: true,
        createdAt: true,
        deletedAt: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new Error("User session not found or inactive.");
    }

    return user;
  }
}
