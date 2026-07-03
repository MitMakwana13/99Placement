import { prisma, Company, Prisma } from "@workspace/db-prisma";

// ─── Filter / Pagination interfaces ──────────────────────────────────────────

export interface CompanyFilters {
  search?: string;
  name?: string;
  industry?: string;
  city?: string;
  state?: string;
  country?: string;
  recruiterId?: string;
  status?: "active" | "archived" | "deleted";
  tags?: string[];
  companyType?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface CompanyPaginationParams {
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CompanyPaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

// ─── Standard Company include (all relations) ──────────────────────────────

const COMPANY_INCLUDE = {
  address: true,
  contacts: { where: { deletedAt: null }, orderBy: { isPrimary: "desc" as const } },
  departments: { orderBy: { name: "asc" as const } },
  documents: { orderBy: { uploadedAt: "desc" as const } },
  tags: { orderBy: { name: "asc" as const } },
  recruiters: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
} as const;

// ─── Repository ──────────────────────────────────────────────────────────────

export class CompanyRepository {
  // ── Core lookups ──────────────────────────────────────────────────────────

  static async findById(
    tenantId: string,
    id: string,
    includeArchived = false
  ) {
    return prisma.company.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
        ...(includeArchived ? {} : { archivedAt: null }),
      },
      include: COMPANY_INCLUDE,
    });
  }

  static async findByIdIncludeDeleted(tenantId: string, id: string) {
    return prisma.company.findFirst({
      where: { id, tenantId },
      include: COMPANY_INCLUDE,
    });
  }

  static async findByName(tenantId: string, name: string) {
    return prisma.company.findFirst({
      where: { tenantId, name: { equals: name, mode: "insensitive" }, deletedAt: null },
    });
  }

  static async findByGstin(tenantId: string, gstin: string) {
    return prisma.company.findFirst({
      where: { tenantId, gstin, deletedAt: null },
    });
  }

  static async findByEmail(tenantId: string, email: string) {
    return prisma.company.findFirst({
      where: { tenantId, email: { equals: email, mode: "insensitive" }, deletedAt: null },
    });
  }

  static async findByPhone(tenantId: string, phone: string) {
    return prisma.company.findFirst({
      where: { tenantId, phone, deletedAt: null },
    });
  }

  // ── Paginated list ────────────────────────────────────────────────────────

  static async findManyPaginated(
    tenantId: string,
    filters: CompanyFilters = {},
    pagination: CompanyPaginationParams = {}
  ): Promise<CompanyPaginatedResult<any>> {
    const { limit = 10, cursor, sortBy = "createdAt", sortOrder = "desc" } = pagination;
    const take = limit + 1;

    // Status filter
    const statusFilter: Prisma.CompanyWhereInput =
      filters.status === "archived"
        ? { archivedAt: { not: null }, deletedAt: null }
        : filters.status === "deleted"
        ? { deletedAt: { not: null } }
        : { deletedAt: null, archivedAt: null };

    // Recruiter filter via join
    const recruiterFilter: Prisma.CompanyWhereInput = filters.recruiterId
      ? { recruiters: { some: { userId: filters.recruiterId } } }
      : {};

    // Tag filter
    const tagFilter: Prisma.CompanyWhereInput =
      filters.tags && filters.tags.length > 0
        ? { tags: { some: { name: { in: filters.tags } } } }
        : {};

    // Address filter
    const addressFilter: Prisma.CompanyWhereInput =
      filters.city || filters.state || filters.country
        ? {
            address: {
              city: filters.city ? { contains: filters.city, mode: "insensitive" } : undefined,
              state: filters.state ? { contains: filters.state, mode: "insensitive" } : undefined,
              country: filters.country ? { contains: filters.country, mode: "insensitive" } : undefined,
            },
          }
        : {};

    const where: Prisma.CompanyWhereInput = {
      tenantId,
      ...statusFilter,
      ...recruiterFilter,
      ...tagFilter,
      ...addressFilter,
      ...(filters.name ? { name: { contains: filters.name, mode: "insensitive" } } : {}),
      ...(filters.industry ? { industry: { contains: filters.industry, mode: "insensitive" } } : {}),
      ...(filters.companyType ? { companyType: filters.companyType } : {}),
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { industry: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
              { gstin: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters.createdFrom || filters.createdTo
        ? {
            createdAt: {
              ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
              ...(filters.createdTo ? { lte: filters.createdTo } : {}),
            },
          }
        : {}),
    };

    const orderBy = { [sortBy]: sortOrder } as Prisma.CompanyOrderByWithRelationInput;

    const [rows, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: COMPANY_INCLUDE,
        orderBy,
        take,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.company.count({ where }),
    ]);

    const hasMore = rows.length === take;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data, nextCursor, hasMore, total };
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  static async softDelete(tenantId: string, id: string) {
    return prisma.company.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });
  }

  static async archive(tenantId: string, id: string) {
    return prisma.company.update({
      where: { id, tenantId },
      data: { archivedAt: new Date(), isActive: false },
    });
  }

  static async restore(tenantId: string, id: string) {
    return prisma.company.update({
      where: { id, tenantId },
      data: { archivedAt: null, deletedAt: null, isActive: true },
    });
  }

  static async permanentDelete(tenantId: string, id: string) {
    return prisma.company.delete({ where: { id, tenantId } });
  }

  // ── Saved Filters ─────────────────────────────────────────────────────────

  static async saveFilter(
    tenantId: string,
    userId: string,
    name: string,
    filters: Record<string, any>
  ) {
    return prisma.savedFilter.upsert({
      where: { tenantId_userId_name: { tenantId, userId, name } },
      create: { tenantId, userId, name, filters },
      update: { filters },
    });
  }

  static async getFilters(tenantId: string, userId: string) {
    return prisma.savedFilter.findMany({ where: { tenantId, userId } });
  }
}
