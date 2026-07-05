import { prisma, Candidate } from "@workspace/db-prisma";
import { AppError } from "../utils/app-error";
import { CandidateRepository } from "../repositories/candidate.repository";
import { domainEventBus } from "../events/event-bus";
import { redisCache } from "../config/redis";
import {
  CandidateCreatedEvent,
  CandidateUpdatedEvent,
  CandidateDeletedEvent,
  CandidateRestoredEvent,
  CandidateMergedEvent,
} from "../events/candidate/candidate.events";
import { logger } from "../config/logger";
import { CreateCandidateInput, UpdateCandidateInput } from "./candidate.service";

export class CandidateCommandService {
  /**
   * Helper to evict all cache keys related to a candidate
   */
  private static async evictCache(tenantId: string, id: string, email?: string | null, phone?: string | null) {
    try {
      await redisCache.del(`candidate:${tenantId}:${id}:true`);
      await redisCache.del(`candidate:${tenantId}:${id}:false`);
      if (email) {
        await redisCache.del(`candidate:email:${tenantId}:${email.toLowerCase()}`);
      }
      if (phone) {
        await redisCache.del(`candidate:phone:${tenantId}:${phone}`);
      }
    } catch (err: any) {
      logger.warn(`Failed evicting cache for candidate ${id}: ${err.message}`);
    }
  }

  /**
   * Enterprise Candidate Creation with cache management & outbox integration placeholder
   */
  static async createCandidate(
    tenantId: string,
    input: CreateCandidateInput,
    performedById?: string
  ): Promise<Candidate> {
    // 1. Duplicate email check
    const existingEmail = await CandidateRepository.findByEmail(tenantId, input.email);
    if (existingEmail) {
      throw AppError.conflict("A candidate with this email address already exists.", "DUPLICATE_EMAIL");
    }

    // 2. Duplicate phone check
    if (input.phone) {
      const existingPhone = await CandidateRepository.findByPhone(tenantId, input.phone);
      if (existingPhone) {
        throw AppError.conflict("A candidate with this phone number already exists.", "DUPLICATE_PHONE");
      }
    }

    // 3. Duplicate resume check (using document checksum matching)
    if (input.documents) {
      for (const doc of input.documents) {
        if (doc.documentType === "RESUME" && doc.checksum) {
          const duplicateResume = await prisma.candidateDocument.findFirst({
            where: { tenantId, checksum: doc.checksum, candidate: { deletedAt: null } },
            include: { candidate: true },
          });
          if (duplicateResume) {
            throw AppError.conflict(
              `Duplicate resume detected. A profile already exists for candidate '${duplicateResume.candidate.name}' with this resume file.`,
              "DUPLICATE_RESUME"
            );
          }
        }
      }
    }

    // 4. Run Transaction
    const candidate = await prisma.$transaction(async (tx) => {
      // Create Candidate core
      const createdCandidate = await tx.candidate.create({
        data: {
          tenantId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          currentRole: input.currentRole,
          experienceYears: input.experienceYears,
          location: input.location,
          skills: input.skills || [],
          source: (input.source as any) || "PORTAL",
          currentCtc: input.currentCtc,
          expectedCtc: input.expectedCtc,
          noticeDays: input.noticeDays,
          summary: input.summary,
          resumeUrl: input.resumeUrl,
          photoUrl: input.photoUrl,
          questionnaireResponses: input.questionnaireResponses || {},
        },
      });

      const candidateId = createdCandidate.id;

      // Address
      if (input.address) {
        await tx.candidateAddress.create({
          data: {
            ...input.address,
            tenantId,
            candidateId,
          },
        });
      }

      // Educations
      if (input.educations && input.educations.length > 0) {
        await tx.candidateEducation.createMany({
          data: input.educations.map((edu) => ({
            ...edu,
            tenantId,
            candidateId,
          })),
        });
      }

      // Experiences
      if (input.experiences && input.experiences.length > 0) {
        await tx.candidateExperience.createMany({
          data: input.experiences.map((exp) => ({
            ...exp,
            tenantId,
            candidateId,
          })),
        });
      }

      // Skills List
      if (input.skillsList && input.skillsList.length > 0) {
        await tx.candidateSkill.createMany({
          data: input.skillsList.map((sk) => ({
            ...sk,
            tenantId,
            candidateId,
          })),
        });
      }

      // Languages
      if (input.languages && input.languages.length > 0) {
        await tx.candidateLanguage.createMany({
          data: input.languages.map((ln) => ({
            ...ln,
            tenantId,
            candidateId,
          })),
        });
      }

      // Certifications
      if (input.certifications && input.certifications.length > 0) {
        await tx.candidateCertification.createMany({
          data: input.certifications.map((cert) => ({
            ...cert,
            tenantId,
            candidateId,
          })),
        });
      }

      // Documents
      if (input.documents && input.documents.length > 0) {
        await tx.candidateDocument.createMany({
          data: input.documents.map((doc) => ({
            ...doc,
            tenantId,
            candidateId,
          })),
        });
      }

      // Tags
      if (input.tags && input.tags.length > 0) {
        await tx.candidateTag.createMany({
          data: input.tags.map((tag) => ({
            name: tag,
            tenantId,
            candidateId,
          })),
        });
      }

      return createdCandidate;
    });

    // 5. Publish event (awaited — deterministic side-effects)
    await domainEventBus.publish(
      new CandidateCreatedEvent(tenantId, candidate.id, performedById)
    );

    return candidate;
  }

  /**
   * Enterprise Candidate Update with validations and transaction
   */
  static async updateCandidate(
    tenantId: string,
    id: string,
    input: UpdateCandidateInput,
    performedById?: string
  ): Promise<Candidate> {
    const candidate = await CandidateRepository.findById(tenantId, id);
    if (!candidate) {
      throw AppError.notFound("Candidate not found.");
    }

    // 1. Email check
    if (input.email && input.email !== candidate.email) {
      const existingEmail = await CandidateRepository.findByEmail(tenantId, input.email);
      if (existingEmail && existingEmail.id !== id) {
        throw AppError.conflict("A candidate with this email address already exists.", "DUPLICATE_EMAIL");
      }
    }

    // 2. Phone check
    if (input.phone && input.phone !== candidate.phone) {
      const existingPhone = await CandidateRepository.findByPhone(tenantId, input.phone);
      if (existingPhone && existingPhone.id !== id) {
        throw AppError.conflict("A candidate with this phone number already exists.", "DUPLICATE_PHONE");
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Core Candidate updates
      const updatedCore = await tx.candidate.update({
        where: { id, tenantId },
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          currentRole: input.currentRole,
          experienceYears: input.experienceYears,
          location: input.location,
          skills: input.skills,
          source: input.source as any,
          currentCtc: input.currentCtc,
          expectedCtc: input.expectedCtc,
          noticeDays: input.noticeDays,
          summary: input.summary,
          resumeUrl: input.resumeUrl,
          photoUrl: input.photoUrl,
          questionnaireResponses: input.questionnaireResponses || {},
        },
      });

      // Address updates
      if (input.address) {
        await tx.candidateAddress.upsert({
          where: { candidateId: id },
          create: {
            ...input.address,
            tenantId,
            candidateId: id,
          },
          update: input.address,
        });
      }

      // Educations
      if (input.educations !== undefined) {
        await tx.candidateEducation.deleteMany({ where: { candidateId: id } });
        if (input.educations.length > 0) {
          await tx.candidateEducation.createMany({
            data: input.educations.map((edu) => ({
              ...edu,
              tenantId,
              candidateId: id,
            })),
          });
        }
      }

      // Experiences
      if (input.experiences !== undefined) {
        await tx.candidateExperience.deleteMany({ where: { candidateId: id } });
        if (input.experiences.length > 0) {
          await tx.candidateExperience.createMany({
            data: input.experiences.map((exp) => ({
              ...exp,
              tenantId,
              candidateId: id,
            })),
          });
        }
      }

      // SkillsList
      if (input.skillsList !== undefined) {
        await tx.candidateSkill.deleteMany({ where: { candidateId: id } });
        if (input.skillsList.length > 0) {
          await tx.candidateSkill.createMany({
            data: input.skillsList.map((sk) => ({
              ...sk,
              tenantId,
              candidateId: id,
            })),
          });
        }
      }

      // Languages
      if (input.languages !== undefined) {
        await tx.candidateLanguage.deleteMany({ where: { candidateId: id } });
        if (input.languages.length > 0) {
          await tx.candidateLanguage.createMany({
            data: input.languages.map((ln) => ({
              ...ln,
              tenantId,
              candidateId: id,
            })),
          });
        }
      }

      // Certifications
      if (input.certifications !== undefined) {
        await tx.candidateCertification.deleteMany({ where: { candidateId: id } });
        if (input.certifications.length > 0) {
          await tx.candidateCertification.createMany({
            data: input.certifications.map((cert) => ({
              ...cert,
              tenantId,
              candidateId: id,
            })),
          });
        }
      }

      // Documents
      if (input.documents !== undefined) {
        await tx.candidateDocument.deleteMany({ where: { candidateId: id } });
        if (input.documents.length > 0) {
          await tx.candidateDocument.createMany({
            data: input.documents.map((doc) => ({
              ...doc,
              tenantId,
              candidateId: id,
            })),
          });
        }
      }

      // Tags
      if (input.tags !== undefined) {
        await tx.candidateTag.deleteMany({ where: { candidateId: id } });
        if (input.tags.length > 0) {
          await tx.candidateTag.createMany({
            data: input.tags.map((tag) => ({
              name: tag,
              tenantId,
              candidateId: id,
            })),
          });
        }
      }

      return updatedCore;
    });

    // Evict Cache
    await this.evictCache(tenantId, id, candidate.email, candidate.phone);
    if (input.email && input.email !== candidate.email) {
      await this.evictCache(tenantId, id, input.email);
    }
    if (input.phone && input.phone !== candidate.phone) {
      await this.evictCache(tenantId, id, undefined, input.phone);
    }

    // Detect changes for timeline audit
    const changes: Record<string, any> = {};
    if (input.name && input.name !== candidate.name) changes.name = { old: candidate.name, new: input.name };
    if (input.email && input.email !== candidate.email) changes.email = { old: candidate.email, new: input.email };
    if (input.currentRole && input.currentRole !== candidate.currentRole) {
      changes.currentRole = { old: candidate.currentRole, new: input.currentRole };
    }

    await domainEventBus.publish(
      new CandidateUpdatedEvent(tenantId, id, changes, performedById)
    );

    return updated;
  }

  /**
   * Soft Deletes Candidate profile
   */
  static async softDeleteCandidate(
    tenantId: string,
    id: string,
    performedById?: string
  ): Promise<Candidate> {
    const candidate = await CandidateRepository.findById(tenantId, id);
    if (!candidate) {
      throw AppError.notFound("Candidate not found.");
    }

    const deleted = await CandidateRepository.softDelete(tenantId, id);
    await this.evictCache(tenantId, id, candidate.email, candidate.phone);

    await domainEventBus.publish(
      new CandidateDeletedEvent(tenantId, id, performedById)
    );

    return deleted;
  }

  /**
   * Restores soft deleted Candidate
   */
  static async restoreCandidate(
    tenantId: string,
    id: string,
    performedById?: string
  ): Promise<Candidate> {
    const candidate = await CandidateRepository.findById(tenantId, id, true);
    if (!candidate) {
      throw AppError.notFound("Candidate profile not found.");
    }

    const restored = await CandidateRepository.restore(tenantId, id);
    await this.evictCache(tenantId, id, restored.email, restored.phone);

    await domainEventBus.publish(
      new CandidateRestoredEvent(tenantId, id, performedById)
    );

    return restored;
  }

  /**
   * Permanent Delete
   */
  static async permanentDeleteCandidate(
    tenantId: string,
    id: string
  ): Promise<Candidate> {
    const candidate = await CandidateRepository.findById(tenantId, id, true);
    if (!candidate) {
      throw AppError.notFound("Candidate profile not found.");
    }

    const result = await CandidateRepository.permanentDelete(tenantId, id);
    await this.evictCache(tenantId, id, candidate.email, candidate.phone);
    return result;
  }

  /**
   * Merges a source duplicate candidate profile into a target profile
   */
  static async mergeCandidates(
    tenantId: string,
    sourceCandidateId: string,
    targetCandidateId: string,
    performedById?: string
  ): Promise<Candidate> {
    if (sourceCandidateId === targetCandidateId) {
      throw AppError.badRequest("Source and Target candidate profiles cannot be the same.");
    }

    const source = await CandidateRepository.findById(tenantId, sourceCandidateId);
    const target = await CandidateRepository.findById(tenantId, targetCandidateId);

    if (!source || !target) {
      throw AppError.notFound("One or both candidate profiles were not found.");
    }

    await prisma.$transaction(async (tx) => {
      // 1. Move Address if target doesn't have one
      if (source.address && !target.address) {
        await tx.candidateAddress.create({
          data: {
            tenantId,
            candidateId: targetCandidateId,
            addressLine1: source.address.addressLine1,
            addressLine2: source.address.addressLine2,
            city: source.address.city,
            state: source.address.state,
            postalCode: source.address.postalCode,
            country: source.address.country,
            addressType: source.address.addressType,
          },
        });
      }

      // 2. Transfer experiences
      if (source.experiences.length > 0) {
        await tx.candidateExperience.updateMany({
          where: { candidateId: sourceCandidateId, tenantId },
          data: { candidateId: targetCandidateId },
        });
      }

      // 3. Transfer educations
      if (source.educations.length > 0) {
        await tx.candidateEducation.updateMany({
          where: { candidateId: sourceCandidateId, tenantId },
          data: { candidateId: targetCandidateId },
        });
      }

      // 4. Transfer languages
      if (source.languages.length > 0) {
        for (const lang of source.languages) {
          const targetLang = target.languages.find((l) => l.language.toLowerCase() === lang.language.toLowerCase());
          if (!targetLang) {
            await tx.candidateLanguage.create({
              data: {
                tenantId,
                candidateId: targetCandidateId,
                language: lang.language,
                proficiency: lang.proficiency,
              },
            });
          }
        }
        await tx.candidateLanguage.deleteMany({ where: { candidateId: sourceCandidateId, tenantId } });
      }

      // 5. Transfer skills
      if (source.skillsList.length > 0) {
        for (const skill of source.skillsList) {
          const targetSkill = target.skillsList.find((s) => s.name.toLowerCase() === skill.name.toLowerCase());
          if (!targetSkill) {
            await tx.candidateSkill.create({
              data: {
                tenantId,
                candidateId: targetCandidateId,
                name: skill.name,
                rating: skill.rating,
                yearsOfExperience: skill.yearsOfExperience,
              },
            });
          }
        }
        await tx.candidateSkill.deleteMany({ where: { candidateId: sourceCandidateId, tenantId } });
      }

      // Combine tags
      const combinedSkills = Array.from(new Set([...(source.skills || []), ...(target.skills || [])]));
      await tx.candidate.update({
        where: { id: targetCandidateId },
        data: { skills: combinedSkills },
      });

      // 6. Transfer certifications
      if (source.certifications.length > 0) {
        await tx.candidateCertification.updateMany({
          where: { candidateId: sourceCandidateId, tenantId },
          data: { candidateId: targetCandidateId },
        });
      }

      // 7. Transfer documents
      if (source.documents.length > 0) {
        await tx.candidateDocument.updateMany({
          where: { candidateId: sourceCandidateId, tenantId },
          data: { candidateId: targetCandidateId },
        });
      }

      // 8. Transfer notes
      if (source.notes.length > 0) {
        await tx.candidateNote.updateMany({
          where: { candidateId: sourceCandidateId, tenantId },
          data: { candidateId: targetCandidateId },
        });
      }

      // 9. Transfer tags
      if (source.tags.length > 0) {
        for (const tag of source.tags) {
          const targetTag = target.tags.find((t) => t.name.toLowerCase() === tag.name.toLowerCase());
          if (!targetTag) {
            await tx.candidateTag.create({
              data: {
                tenantId,
                candidateId: targetCandidateId,
                name: tag.name,
              },
            });
          }
        }
        await tx.candidateTag.deleteMany({ where: { candidateId: sourceCandidateId, tenantId } });
      }

      // 10. Transfer timeline events
      if (source.timeline.length > 0) {
        await tx.candidateTimeline.updateMany({
          where: { candidateId: sourceCandidateId, tenantId },
          data: { candidateId: targetCandidateId },
        });
      }

      // 11. Soft delete the source candidate
      await tx.candidate.update({
        where: { id: sourceCandidateId, tenantId },
        data: { deletedAt: new Date() },
      });
    });

    // 12. Evict cache for target and source
    await this.evictCache(tenantId, sourceCandidateId, source.email, source.phone);
    await this.evictCache(tenantId, targetCandidateId, target.email, target.phone);

    // 13. Publish event (awaited)
    await domainEventBus.publish(
      new CandidateMergedEvent(tenantId, sourceCandidateId, targetCandidateId, performedById)
    );

    const finalTarget = await CandidateRepository.findById(tenantId, targetCandidateId);
    if (!finalTarget) {
      throw AppError.notFound("Merged candidate profile not found.");
    }
    return finalTarget;
  }
}
