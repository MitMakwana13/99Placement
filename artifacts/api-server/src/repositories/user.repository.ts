import { prisma, User, UserPreference, Prisma } from "@workspace/db-prisma";

export class UserRepository {
  /**
   * Creates a new User record
   */
  static async create(data: Prisma.UserUncheckedCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  /**
   * Finds a User by ID (including tenant and dynamic role relationships)
   */
  static async findById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        tenant: true,
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
  }

  /**
   * Finds a User by Email
   */
  static async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: {
        tenant: true,
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
  }

  /**
   * Finds a User by Email and Tenant ID
   */
  static async findByEmailAndTenant(email: string, tenantId: string) {
    return prisma.user.findFirst({
      where: { email, tenantId, deletedAt: null },
      include: {
        tenant: true,
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
  }

  /**
   * Updates a User record
   */
  static async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft deletes a User record
   */
  static async softDelete(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Finds User preferences
   */
  static async findPreferences(userId: string): Promise<UserPreference | null> {
    return prisma.userPreference.findUnique({
      where: { userId },
    });
  }

  /**
   * Upserts User preferences
   */
  static async upsertPreferences(
    userId: string,
    theme: string = "light",
    emailNotifications: boolean = true,
    calendarTokenEnc?: string | null
  ): Promise<UserPreference> {
    return prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        theme,
        emailNotifications,
        calendarTokenEnc,
      },
      update: {
        theme,
        emailNotifications,
        calendarTokenEnc,
      },
    });
  }
}
