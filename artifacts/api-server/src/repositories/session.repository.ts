import { prisma, UserSession } from "@workspace/db-prisma";

export class SessionRepository {
  /**
   * Creates a new User Session record
   */
  static async create(
    userId: string,
    refreshTokenHash: string,
    expiresAt: Date,
    ipAddress?: string | null,
    userAgent?: string | null
  ): Promise<UserSession> {
    return prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Finds a session by its refresh token hash
   */
  static async findByTokenHash(refreshTokenHash: string) {
    return prisma.userSession.findFirst({
      where: { refreshTokenHash },
      include: {
        user: {
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
        },
      },
    });
  }

  /**
   * Deletes a session by ID
   */
  static async deleteById(id: string): Promise<void> {
    await prisma.userSession.delete({
      where: { id },
    });
  }

  /**
   * Deletes all sessions for a specific User (Logout all devices)
   */
  static async deleteByUserId(userId: string): Promise<void> {
    await prisma.userSession.deleteMany({
      where: { userId },
    });
  }

  /**
   * Deletes expired sessions
   */
  static async deleteExpired(): Promise<void> {
    await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
