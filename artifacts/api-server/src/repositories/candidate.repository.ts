import { prisma, Candidate, Prisma, SavedFilter } from "@workspace/db-prisma";

export interface CandidateFilters {
  search?: string;
  name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  minExperience?: number;
  maxExperience?: number;
  currentCompany?: string;
  minCurrentCtc?: number;
  maxCurrentCtc?: number;
  minExpectedCtc?: number;
  maxExpectedCtc?: number;
  maxNoticeDays?: number;
  location?: string;
  status?: string;
  source?: string;
  tags?: string[];
  recruiterId?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface PaginationParams {
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export class CandidateRepository {
  /**
   * Creates a new Candidate record with associated profiles
   */
  static async create(
    tenantId: string,
    data: Prisma.CandidateUncheckedCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Candidate> {
    const client = tx || prisma;
    return client.candidate.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  /**
   * Finds a candidate by ID (matching tenant isolation, soft deleted excluded)
   */
  static async findById(
    tenantId: string,
    id: string,
    includeDeleted = false
  ) {
    return prisma.candidate.findFirst({
      where: {
        id,
        tenantId,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      include: {
        address: true,
        educations: true,
        experiences: true,
        skillsList: true,
        languages: true,
        certifications: true,
        documents: true,
        tags: true,
        notes: {
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        timeline: {
          orderBy: { createdAt: "desc" },
        },
        pipelines: {
          include: {
            job: true,
            assignedRecruiter: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });
  }

  /**
   * Finds a Candidate by Email
   */
  static async findByEmail(tenantId: string, email: string) {
    return prisma.candidate.findFirst({
      where: { email, tenantId, deletedAt: null },
    });
  }

  /**
   * Finds a Candidate by Phone
   */
  static async findByPhone(tenantId: string, phone: string) {
    return prisma.candidate.findFirst({
      where: { phone, tenantId, deletedAt: null },
    });
  }

  /**
   * Updates Candidate details
   */
  static async update(
    tenantId: string,
    id: string,
    data: Prisma.CandidateUpdateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Candidate> {
    const client = tx || prisma;
    return client.candidate.update({
      where: { id, tenantId },
      data,
    });
  }

  /**
   * Soft deletes a Candidate
   */
  static async softDelete(
    tenantId: string,
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<Candidate> {
    const client = tx || prisma;
    return client.candidate.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restores a soft-deleted Candidate
   */
  static async restore(
    tenantId: string,
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<Candidate> {
    const client = tx || prisma;
    return client.candidate.update({
      where: { id, tenantId },
      data: { deletedAt: null },
    });
  }

  /**
   * Permanently deletes a Candidate record
   */
  static async permanentDelete(
    tenantId: string,
    id: string,
    tx?: Prisma.TransactionClient
  ): Promise<Candidate> {
    const client = tx || prisma;
    return client.candidate.delete({
      where: { id, tenantId },
    });
  }

  /**
   * Dynamic search, filters, and cursor-based pagination
   */
  static async findManyPaginated(
    tenantId: string,
    filters: CandidateFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<any>> {
    const limit = pagination.limit || 10;
    const sortBy = pagination.sortBy || "createdAt";
    const sortOrder = pagination.sortOrder || "desc";

    const where: Prisma.CandidateWhereInput = {
      tenantId,
      deletedAt: null,
    };

    // Full-Text / Text Fallback Search
    if (filters.search) {
      const searchQuery = filters.search;
      where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
        { phone: { contains: searchQuery, mode: "insensitive" } },
        { location: { contains: searchQuery, mode: "insensitive" } },
        { summary: { contains: searchQuery, mode: "insensitive" } },
        { currentRole: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    // Exact and Range Filters
    if (filters.name) {
      where.name = { contains: filters.name, mode: "insensitive" };
    }
    if (filters.email) {
      where.email = { contains: filters.email, mode: "insensitive" };
    }
    if (filters.phone) {
      where.phone = { contains: filters.phone, mode: "insensitive" };
    }
    if (filters.location) {
      where.location = { contains: filters.location, mode: "insensitive" };
    }
    if (filters.source) {
      where.source = filters.source as any;
    }

    // Years of Experience range
    if (filters.minExperience !== undefined || filters.maxExperience !== undefined) {
      where.experienceYears = {};
      if (filters.minExperience !== undefined) {
        where.experienceYears.gte = filters.minExperience;
      }
      if (filters.maxExperience !== undefined) {
        where.experienceYears.lte = filters.maxExperience;
      }
    }

    // Notice Period maximum filter
    if (filters.maxNoticeDays !== undefined) {
      where.noticeDays = { lte: filters.maxNoticeDays };
    }

    // Current Salary range
    if (filters.minCurrentCtc !== undefined || filters.maxCurrentCtc !== undefined) {
      where.currentCtc = {};
      if (filters.minCurrentCtc !== undefined) {
        where.currentCtc.gte = filters.minCurrentCtc;
      }
      if (filters.maxCurrentCtc !== undefined) {
        where.currentCtc.lte = filters.maxCurrentCtc;
      }
    }

    // Expected Salary range
    if (filters.minExpectedCtc !== undefined || filters.maxExpectedCtc !== undefined) {
      where.expectedCtc = {};
      if (filters.minExpectedCtc !== undefined) {
        where.expectedCtc.gte = filters.minExpectedCtc;
      }
      if (filters.maxExpectedCtc !== undefined) {
        where.expectedCtc.lte = filters.maxExpectedCtc;
      }
    }

    // Skills array contains/all skills match
    if (filters.skills && filters.skills.length > 0) {
      // Check if skills match either in core skills array or skillsList relation
      where.OR = [
        { skills: { hasSome: filters.skills } },
        {
          skillsList: {
            some: {
              name: { in: filters.skills, mode: "insensitive" },
            },
          },
        },
      ];
    }

    // Current Company (matched in Experience history)
    if (filters.currentCompany) {
      where.experiences = {
        some: {
          company: { contains: filters.currentCompany, mode: "insensitive" },
          isCurrent: true,
        },
      };
    }

    // Pipeline stage status
    if (filters.status) {
      where.pipelines = {
        some: {
          stage: filters.status as any,
        },
      };
    }

    // Recruiter Filter
    if (filters.recruiterId) {
      where.pipelines = {
        some: {
          assignedRecruiterId: filters.recruiterId,
        },
      };
    }

    // Candidate tags
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        some: {
          name: { in: filters.tags, mode: "insensitive" },
        },
      };
    }

    // Date range filter
    if (filters.createdFrom || filters.createdTo) {
      where.createdAt = {};
      if (filters.createdFrom) {
        where.createdAt.gte = filters.createdFrom;
      }
      if (filters.createdTo) {
        where.createdAt.lte = filters.createdTo;
      }
    }

    // Setup cursor pagination
    const queryOptions: Prisma.CandidateFindManyArgs = {
      where,
      take: limit + 1,
      orderBy: { [sortBy]: sortOrder },
      include: {
        address: true,
        educations: true,
        experiences: true,
        skillsList: true,
        languages: true,
        certifications: true,
        documents: true,
        tags: true,
        notes: {
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        pipelines: {
          include: {
            job: true,
            assignedRecruiter: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    };

    if (pagination.cursor) {
      queryOptions.cursor = { id: pagination.cursor };
      queryOptions.skip = 1;
    }

    const results = await prisma.candidate.findMany(queryOptions);

    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Save search filter configurations
   */
  static async saveFilter(
    tenantId: string,
    userId: string,
    name: string,
    filters: Record<string, any>
  ): Promise<SavedFilter> {
    return prisma.savedFilter.upsert({
      where: {
        tenantId_userId_name: {
          tenantId,
          userId,
          name,
        },
      },
      create: {
        tenantId,
        userId,
        name,
        filters,
      },
      update: {
        filters,
      },
    });
  }

  /**
   * Fetch all saved filters for a user
   */
  static async getSavedFilters(tenantId: string, userId: string): Promise<SavedFilter[]> {
    return prisma.savedFilter.findMany({
      where: { tenantId, userId, entityType: "CANDIDATE" },
      orderBy: { updatedAt: "desc" },
    });
  }
}
