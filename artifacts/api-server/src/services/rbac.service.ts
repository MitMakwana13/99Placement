import { prisma } from "@workspace/db-prisma";
import { redisCache } from "../config/redis";
import { logger } from "../config/logger";

export class RbacService {
  private static STANDARD_PERMISSIONS = [
    { code: "candidates:read", description: "View candidate profiles" },
    { code: "candidates:create", description: "Create candidate profiles" },
    { code: "candidates:update", description: "Modify candidate profiles" },
    { code: "candidates:delete", description: "Soft delete candidate profiles" },
    { code: "companies:read", description: "View company profiles" },
    { code: "companies:create", description: "Create company profiles" },
    { code: "companies:update", description: "Modify company profiles and assignments" },
    { code: "companies:delete", description: "Archive or permanently delete company profiles" },
    { code: "jobs:read", description: "View job requirements" },
    { code: "jobs:create", description: "Create job requirements" },
    { code: "jobs:update", description: "Modify job requirements" },
    { code: "jobs:delete", description: "Archive or permanently delete job requirements" },
    { code: "jobs:approve", description: "Approve job postings for publishing" },
    { code: "interviews:read", description: "View interview schedules" },
    { code: "interviews:create", description: "Schedule candidate interviews" },
    { code: "interviews:update", description: "Modify interview details" },
    { code: "interviews:delete", description: "Cancel interviews" },
    { code: "interviews:write_feedback", description: "Submit feedback score and summary for candidate interviews" },
    { code: "assessments:read", description: "View test templates and scores" },
    { code: "assessments:create", description: "Configure test questions and duration templates" },
    { code: "assessments:update", description: "Edit evaluation templates" },
    { code: "assessments:delete", description: "Archive assessment templates" },
    { code: "offers:read", description: "View offer letters and compensation layouts" },
    { code: "offers:create", description: "Draft candidate offer letters" },
    { code: "offers:update", description: "Revoke or edit draft offer details" },
    { code: "offers:approve", description: "Approve formal offer packages for delivery" },
    { code: "joining:read", description: "View onboarding candidates" },
    { code: "joining:update", description: "Mark background check verification tasks as completed" },
    { code: "screenings:read",    description: "View internal screening interview records" },
    { code: "screenings:create",  description: "Schedule internal screening interviews" },
    { code: "screenings:update",  description: "Reschedule or cancel screening interviews" },
    { code: "screenings:conduct", description: "Submit screening scorecard and issue verdict" },
    { code: "screenings:delete",  description: "Permanently remove screening records" },
    { code: "settings:read", description: "View tenant branding configurations" },
    { code: "settings:write", description: "Modify tenant domain access limits and timezones" },
  ];

  /**
   * Seeds standardized permission configurations globally
   */
  static async seedPermissions(): Promise<void> {
    for (const perm of this.STANDARD_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { code: perm.code },
        create: perm,
        update: { description: perm.description },
      });
    }
  }

  /**
   * Initializes default roles and associates permissions for a newly onboarded Tenant
   */
  static async initializeTenantRoles(tenantId: string, tx?: any) {
    const client = tx || prisma;

    const roleDefinitions = [
      { name: "TENANT_ADMIN", isSystemRole: true, permissionCodes: ["*"] },
      {
        name: "RECRUITER",
        isSystemRole: true,
        permissionCodes: [
          "candidates:read",
          "candidates:create",
          "candidates:update",
          "companies:read",
          "companies:create",
          "companies:update",
          "jobs:read",
          "jobs:create",
          "jobs:update",
          "jobs:approve",
          "interviews:read",
          "interviews:create",
          "interviews:update",
          "assessments:read",
          "assessments:create",
          "assessments:update",
          "assessments:delete",
          "offers:read",
          "offers:create",
          "joining:read",
          "joining:update",
          "screenings:read",
          "screenings:create",
          "screenings:update",
          "screenings:conduct",
          "settings:read",
        ],
      },
      {
        name: "HR",
        isSystemRole: true,
        permissionCodes: [
          "candidates:read",
          "jobs:read",
          "interviews:read",
          "offers:read",
          "offers:create",
          "offers:update",
          "offers:approve",
          "joining:read",
          "joining:update",
        ],
      },
      {
        name: "CLIENT_USER",
        isSystemRole: true,
        permissionCodes: ["jobs:read", "candidates:read", "interviews:read"],
      },
      {
        name: "CANDIDATE",
        isSystemRole: true,
        permissionCodes: ["interviews:read", "assessments:read"],
      },
    ];

    const rolesCreated: Record<string, any> = {};

    for (const def of roleDefinitions) {
      const role = await client.role.upsert({
        where: {
          tenantId_name: {
            tenantId,
            name: def.name,
          },
        },
        create: {
          tenantId,
          name: def.name,
          isSystemRole: def.isSystemRole,
        },
        update: {},
      });

      rolesCreated[def.name] = role;

      // Extract specific codes or map all standard permissions for admin
      let targetCodes = def.permissionCodes;
      if (def.permissionCodes.includes("*")) {
        targetCodes = this.STANDARD_PERMISSIONS.map((p) => p.code);
      }

      for (const code of targetCodes) {
        const permRecord = await client.permission.findUnique({
          where: { code },
        });

        if (permRecord) {
          await client.rolePermissionMapping.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permRecord.id,
              },
            },
            create: {
              roleId: role.id,
              permissionId: permRecord.id,
            },
            update: {},
          });
        }
      }
    }

    return rolesCreated;
  }

  static async getUserPermissions(userId: string): Promise<string[]> {
    const cacheKey = `user_permissions:${userId}`;
    try {
      const cached = await redisCache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err: any) {
      logger.warn(`Failed reading user permissions cache: ${err.message}`);
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return [];
    }

    const permissions = user.role.permissions.map((p) => p.permission.code);

    try {
      await redisCache.set(cacheKey, JSON.stringify(permissions), 300); // 5 mins TTL
    } catch (err: any) {
      logger.warn(`Failed writing user permissions to cache: ${err.message}`);
    }

    return permissions;
  }

  /**
   * Verifies if a user has a specific permission code
   */
  static async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permissionCode);
  }
}
