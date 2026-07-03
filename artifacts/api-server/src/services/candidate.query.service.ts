import { Candidate, SavedFilter } from "@workspace/db-prisma";
import { CandidateRepository, CandidateFilters, PaginationParams, PaginatedResult } from "../repositories/candidate.repository";
import { redisCache } from "../config/redis";
import { logger } from "../config/logger";

export class CandidateQueryService {
  /**
   * Enterprise Candidate Retrieve by ID with Redis Caching
   */
  static async getCandidateById(
    tenantId: string,
    id: string,
    includeDeleted = false
  ): Promise<any> {
    const cacheKey = `candidate:${tenantId}:${id}:${includeDeleted}`;

    // Try cache lookup
    try {
      const cached = await redisCache.get(cacheKey);
      if (cached) {
        logger.debug(`Cache HIT for candidate ID: ${id}`);
        // Deserialize dates correctly
        return JSON.parse(cached, (key, value) => {
          if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            return new Date(value);
          }
          return value;
        });
      }
    } catch (err: any) {
      logger.warn(`Failed reading candidate from cache: ${err.message}`);
    }

    logger.debug(`Cache MISS for candidate ID: ${id}. Querying DB...`);
    const candidate = await CandidateRepository.findById(tenantId, id, includeDeleted);

    if (candidate) {
      // Store in cache
      try {
        await redisCache.set(cacheKey, JSON.stringify(candidate), 3600); // 1 hour TTL
      } catch (err: any) {
        logger.warn(`Failed writing candidate to cache: ${err.message}`);
      }
    }

    return candidate;
  }

  /**
   * Find Candidate by Email (Direct DB Lookup or cache if needed)
   */
  static async getCandidateByEmail(tenantId: string, email: string): Promise<Candidate | null> {
    const cacheKey = `candidate:email:${tenantId}:${email.toLowerCase()}`;

    try {
      const cachedId = await redisCache.get(cacheKey);
      if (cachedId) {
        const candidate = await this.getCandidateById(tenantId, cachedId);
        if (candidate) return candidate;
      }
    } catch (err: any) {
      logger.warn(`Failed reading candidate by email from cache: ${err.message}`);
    }

    const candidate = await CandidateRepository.findByEmail(tenantId, email);
    if (candidate) {
      try {
        await redisCache.set(cacheKey, candidate.id, 3600);
      } catch (err: any) {
        logger.warn(`Failed caching candidate ID by email: ${err.message}`);
      }
    }
    return candidate;
  }

  /**
   * Find Candidate by Phone
   */
  static async getCandidateByPhone(tenantId: string, phone: string): Promise<Candidate | null> {
    const cacheKey = `candidate:phone:${tenantId}:${phone}`;

    try {
      const cachedId = await redisCache.get(cacheKey);
      if (cachedId) {
        const candidate = await this.getCandidateById(tenantId, cachedId);
        if (candidate) return candidate;
      }
    } catch (err: any) {
      logger.warn(`Failed reading candidate by phone from cache: ${err.message}`);
    }

    const candidate = await CandidateRepository.findByPhone(tenantId, phone);
    if (candidate) {
      try {
        await redisCache.set(cacheKey, candidate.id, 3600);
      } catch (err: any) {
        logger.warn(`Failed caching candidate ID by phone: ${err.message}`);
      }
    }
    return candidate;
  }

  /**
   * Paginated Candidates Query
   */
  static async queryCandidates(
    tenantId: string,
    filters: CandidateFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<any>> {
    // Keep queries non-cached or briefly cached due to complex filters
    return CandidateRepository.findManyPaginated(tenantId, filters, pagination);
  }

  /**
   * Fetch all saved filters for a user
   */
  static async getSavedFilters(tenantId: string, userId: string): Promise<SavedFilter[]> {
    const cacheKey = `filters:${tenantId}:${userId}`;

    try {
      const cached = await redisCache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached, (key, value) => {
          if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            return new Date(value);
          }
          return value;
        });
      }
    } catch (err: any) {
      logger.warn(`Failed reading saved filters from cache: ${err.message}`);
    }

    const filters = await CandidateRepository.getSavedFilters(tenantId, userId);

    try {
      await redisCache.set(cacheKey, JSON.stringify(filters), 1800); // 30 mins TTL
    } catch (err: any) {
      logger.warn(`Failed writing saved filters to cache: ${err.message}`);
    }

    return filters;
  }
}
