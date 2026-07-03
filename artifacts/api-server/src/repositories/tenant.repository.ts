import { prisma, Tenant, TenantSetting, Prisma } from "@workspace/db-prisma";

export class TenantRepository {
  /**
   * Creates a new Tenant record
   */
  static async create(data: Prisma.TenantCreateInput): Promise<Tenant> {
    return prisma.tenant.create({ data });
  }

  /**
   * Finds a Tenant by ID
   */
  static async findById(id: string): Promise<Tenant | null> {
    return prisma.tenant.findFirst({
      where: { id, deletedAt: null },
    });
  }

  /**
   * Finds a Tenant by Slug
   */
  static async findBySlug(slug: string): Promise<Tenant | null> {
    return prisma.tenant.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  /**
   * Updates a Tenant record
   */
  static async update(id: string, data: Prisma.TenantUpdateInput): Promise<Tenant> {
    return prisma.tenant.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft deletes a Tenant record
   */
  static async softDelete(id: string): Promise<Tenant> {
    return prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Finds Tenant Settings
   */
  static async findSettings(tenantId: string): Promise<TenantSetting | null> {
    return prisma.tenantSetting.findUnique({
      where: { tenantId },
    });
  }

  /**
   * Creates or updates Tenant Settings
   */
  static async upsertSettings(
    tenantId: string,
    brandingColor?: string | null,
    allowedLoginDomains: string[] = [],
    timezone: string = "UTC",
    enableAiCopilot: boolean = true
  ): Promise<TenantSetting> {
    return prisma.tenantSetting.upsert({
      where: { tenantId },
      create: {
        tenantId,
        brandingColor,
        allowedLoginDomains: allowedLoginDomains as any,
        timezone,
        enableAiCopilot,
      },
      update: {
        brandingColor,
        allowedLoginDomains: allowedLoginDomains as any,
        timezone,
        enableAiCopilot,
      },
    });
  }
}
