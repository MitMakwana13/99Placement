import { prisma } from "@workspace/db-prisma";
import { PipelineStage } from "@prisma/client";
import { PipelineRepository, PipelineFilters, PaginationOptions } from "../repositories/pipeline.repository";
import { domainEventBus } from "../events/event-bus";
import {
  CandidateAddedToPipelineEvent,
  PipelineStageChangedEvent,
  CandidateRejectedEvent,
  CandidateWithdrawnEvent,
  CandidateShortlistedEvent,
  CandidateHiredEvent,
  ReminderCreatedEvent,
  RatingUpdatedEvent,
} from "../events/pipeline/pipeline.events";
import { AppError } from "../utils/app-error";

export const PipelineService = {

  // ── Create ──────────────────────────────────────────────────────────────────

  async create(
    tenantId: string,
    data: {
      candidateId:        string;
      jobId:              string;
      stage?:             PipelineStage;
      assignedRecruiterId?: string;
      notes?:             string;
    },
    performedById: string,
  ) {
    // 1. Verify Candidate exists
    const candidate = await prisma.candidate.findFirst({
      where: { id: data.candidateId, tenantId, deletedAt: null },
    });
    if (!candidate) {
      throw new AppError("Candidate not found or deleted.", 404);
    }

    // 2. Verify Job exists
    const job = await prisma.job.findFirst({
      where: { id: data.jobId, tenantId, deletedAt: null },
    });
    if (!job) {
      throw new AppError("Job posting not found or deleted.", 404);
    }

    // 3. Create pipeline connection
    const pipeline = await PipelineRepository.create(tenantId, data);

    // 4. Seed default checklist items
    await PipelineRepository.createChecklistItems(tenantId, pipeline.id, [
      { itemKey: "RESUME_REVIEWED", title: "Review Candidate Resume", isCompleted: false },
      { itemKey: "DOCUMENTS_VERIFIED", title: "Verify Candidate Documents", isCompleted: false },
      { itemKey: "REFERENCE_CHECKED", title: "Reference Check", isCompleted: false },
      { itemKey: "OFFER_ACCEPTED", title: "Offer Acceptance Confirmation", isCompleted: false },
    ]);

    // Fetch full pipeline with seeded checklist items
    const fullPipeline = await PipelineRepository.findById(tenantId, pipeline.id);

    // 5. Publish Event
    await domainEventBus.publish(
      new CandidateAddedToPipelineEvent(
        tenantId,
        fullPipeline.id,
        fullPipeline.candidateId,
        fullPipeline.jobId,
        fullPipeline.stage,
        performedById
      )
    );

    return fullPipeline;
  },

  // ── Find By ID ─────────────────────────────────────────────────────────────

  async findById(tenantId: string, id: string) {
    return PipelineRepository.findById(tenantId, id);
  },

  // ── Find Many ──────────────────────────────────────────────────────────────

  async findMany(
    tenantId: string,
    filters: PipelineFilters = {},
    options: PaginationOptions = {},
  ) {
    return PipelineRepository.findMany(tenantId, filters, options);
  },

  // ── Stage Transition (with business invariants check) ──────────────────────

  async updateStage(
    tenantId: string,
    id: string,
    data: {
      newStage: PipelineStage;
      reason?:  string;
    },
    performedById: string,
  ) {
    // 1. Fetch current pipeline record
    const pipeline = await PipelineRepository.findById(tenantId, id);

    if (pipeline.stage === data.newStage) {
      return pipeline;
    }

    // 2. Validate checklist requirements
    if (data.newStage === PipelineStage.OFFER) {
      const documentsChecked = pipeline.checklists.find(c => c.itemKey === "DOCUMENTS_VERIFIED");
      if (documentsChecked && !documentsChecked.isCompleted) {
        throw new AppError("Checklist requirements not met. Candidates must have verified documents before an offer is made.", 400);
      }
    }

    if (data.newStage === PipelineStage.JOINING) {
      const offerAccepted = pipeline.checklists.find(c => c.itemKey === "OFFER_ACCEPTED");
      if (offerAccepted && !offerAccepted.isCompleted) {
        throw new AppError("Checklist requirements not met. Candidate offer must be accepted before setting joining status.", 400);
      }
    }

    // 3. Update stage
    const updated = await PipelineRepository.updateStage(tenantId, id, {
      newStage: data.newStage,
      reason:   data.reason,
      performedById,
    });

    // 4. Publish Event
    await domainEventBus.publish(
      new PipelineStageChangedEvent(
        tenantId,
        updated.id,
        updated.candidateId,
        updated.jobId,
        pipeline.stage,
        updated.stage,
        data.reason,
        performedById
      )
    );

    // 5. Stage-specific side events
    if (updated.stage === PipelineStage.REJECTED) {
      await domainEventBus.publish(new CandidateRejectedEvent(tenantId, updated.id, updated.candidateId, updated.jobId, pipeline.stage, data.reason, performedById));
    } else if (updated.stage === PipelineStage.DROPPED) {
      await domainEventBus.publish(new CandidateWithdrawnEvent(tenantId, updated.id, updated.candidateId, updated.jobId, data.reason, performedById));
    } else if (updated.stage === PipelineStage.SHORTLISTED) {
      await domainEventBus.publish(new CandidateShortlistedEvent(tenantId, updated.id, updated.candidateId, updated.jobId, performedById));
    } else if (updated.stage === PipelineStage.JOINING) {
      await domainEventBus.publish(new CandidateHiredEvent(tenantId, updated.id, updated.candidateId, updated.jobId, performedById));
    }

    return updated;
  },

  // ── Bulk Stage Transition ──────────────────────────────────────────────────

  async bulkUpdateStage(
    tenantId: string,
    ids: string[],
    data: {
      newStage: PipelineStage;
      reason?:  string;
    },
    performedById: string,
  ) {
    // 1. Validate checklist requirements for each candidate pipeline record first
    for (const id of ids) {
      const pipeline = await PipelineRepository.findById(tenantId, id);

      if (data.newStage === PipelineStage.OFFER) {
        const documentsChecked = pipeline.checklists.find(c => c.itemKey === "DOCUMENTS_VERIFIED");
        if (documentsChecked && !documentsChecked.isCompleted) {
          throw new AppError(`Checklist requirements not met for pipeline connection ${id}. Documents must be verified before setting stage to OFFER.`, 400);
        }
      }

      if (data.newStage === PipelineStage.JOINING) {
        const offerAccepted = pipeline.checklists.find(c => c.itemKey === "OFFER_ACCEPTED");
        if (offerAccepted && !offerAccepted.isCompleted) {
          throw new AppError(`Checklist requirements not met for pipeline connection ${id}. Offer must be accepted before setting stage to JOINING.`, 400);
        }
      }
    }

    // 2. Perform bulk update
    const result = await PipelineRepository.bulkUpdateStage(tenantId, ids, {
      newStage: data.newStage,
      reason:   data.reason,
      performedById,
    });

    // 3. Publish events for all modified records
    for (const updated of result.items) {
      // Find old stage from matching update target (defaulting to SOURCED if not matched)
      // Since bulkUpdateStage runs in a transaction, we know they transitioned
      await domainEventBus.publish(
        new PipelineStageChangedEvent(
          tenantId,
          updated.id,
          updated.candidateId,
          updated.jobId,
          null, // Old stage placeholder for bulk
          updated.stage,
          data.reason,
          performedById
        )
      );

      if (updated.stage === PipelineStage.REJECTED) {
        await domainEventBus.publish(new CandidateRejectedEvent(tenantId, updated.id, updated.candidateId, updated.jobId, PipelineStage.SOURCED, data.reason, performedById));
      } else if (updated.stage === PipelineStage.DROPPED) {
        await domainEventBus.publish(new CandidateWithdrawnEvent(tenantId, updated.id, updated.candidateId, updated.jobId, data.reason, performedById));
      } else if (updated.stage === PipelineStage.SHORTLISTED) {
        await domainEventBus.publish(new CandidateShortlistedEvent(tenantId, updated.id, updated.candidateId, updated.jobId, performedById));
      } else if (updated.stage === PipelineStage.JOINING) {
        await domainEventBus.publish(new CandidateHiredEvent(tenantId, updated.id, updated.candidateId, updated.jobId, performedById));
      }
    }

    return result;
  },

  // ── Soft Delete ────────────────────────────────────────────────────────────

  async softDelete(tenantId: string, id: string, performedById: string) {
    return PipelineRepository.softDelete(tenantId, id);
  },

  // ── Restore ────────────────────────────────────────────────────────────────

  async restore(tenantId: string, id: string, performedById: string) {
    return PipelineRepository.restore(tenantId, id);
  },

  // ── Permanent Delete ───────────────────────────────────────────────────────

  async permanentDelete(tenantId: string, id: string, performedById: string) {
    return PipelineRepository.permanentDelete(tenantId, id);
  },

  // ── Notes CRUD ─────────────────────────────────────────────────────────────

  async createNote(
    tenantId: string,
    pipelineId: string,
    data: {
      content:   string;
      isPrivate?: boolean;
    },
    performedById: string,
  ) {
    await PipelineRepository.findById(tenantId, pipelineId); // validation guard
    return PipelineRepository.createNote(tenantId, pipelineId, {
      authorId:  performedById,
      content:   data.content,
      isPrivate: data.isPrivate,
    });
  },

  async deleteNote(tenantId: string, noteId: string) {
    return PipelineRepository.deleteNote(tenantId, noteId);
  },

  // ── Attachments CRUD ───────────────────────────────────────────────────────

  async createAttachment(
    tenantId: string,
    pipelineId: string,
    data: {
      name:     string;
      fileUrl:  string;
      fileKey?:  string;
      fileSize?: number;
    },
    performedById: string,
  ) {
    await PipelineRepository.findById(tenantId, pipelineId); // validation guard
    return PipelineRepository.createAttachment(tenantId, pipelineId, {
      name:         data.name,
      fileUrl:      data.fileUrl,
      fileKey:      data.fileKey,
      fileSize:     data.fileSize,
      uploadedById: performedById,
    });
  },

  async deleteAttachment(tenantId: string, attachmentId: string) {
    return PipelineRepository.deleteAttachment(tenantId, attachmentId);
  },

  // ── Ratings Operations ─────────────────────────────────────────────────────

  async updateRating(
    tenantId: string,
    pipelineId: string,
    data: {
      recruiterRating?: number;
      technicalRating?: number;
      hrRating?:        number;
      overallRating?:   number;
      feedback?:       string;
    },
    performedById: string,
  ) {
    await PipelineRepository.findById(tenantId, pipelineId); // validation guard
    const rating = await PipelineRepository.updateRating(tenantId, pipelineId, {
      ratedById:       performedById,
      recruiterRating: data.recruiterRating,
      technicalRating: data.technicalRating,
      hrRating:        data.hrRating,
      overallRating:   data.overallRating,
      feedback:        data.feedback,
    });

    await domainEventBus.publish(
      new RatingUpdatedEvent(
        tenantId,
        pipelineId,
        rating.id,
        performedById,
        data.recruiterRating ?? null,
        data.technicalRating ?? null,
        data.hrRating ?? null,
        data.overallRating ?? null,
        performedById
      )
    );

    return rating;
  },

  // ── Checklist Operations ───────────────────────────────────────────────────

  async updateChecklistItem(
    tenantId: string,
    pipelineId: string,
    itemKey: string,
    isCompleted: boolean,
    performedById: string,
  ) {
    await PipelineRepository.findById(tenantId, pipelineId); // validation guard
    return PipelineRepository.updateChecklistItem(tenantId, pipelineId, itemKey, {
      isCompleted,
      completedById: performedById,
    });
  },

  // ── Reminders Operations ───────────────────────────────────────────────────

  async createReminder(
    tenantId: string,
    pipelineId: string,
    data: {
      userId:       string;
      title:        string;
      description?:  string;
      reminderType: string;
      remindAt:     Date;
    },
    performedById: string,
  ) {
    await PipelineRepository.findById(tenantId, pipelineId); // validation guard
    const reminder = await PipelineRepository.createReminder(tenantId, pipelineId, data);

    await domainEventBus.publish(
      new ReminderCreatedEvent(
        tenantId,
        pipelineId,
        reminder.id,
        data.userId,
        data.reminderType,
        data.remindAt,
        performedById
      )
    );

    return reminder;
  },

  async updateReminderCompletion(tenantId: string, reminderId: string, isCompleted: boolean) {
    return PipelineRepository.updateReminderCompletion(tenantId, reminderId, isCompleted);
  },

  // ── Metrics Operations ─────────────────────────────────────────────────────

  async getPipelineMetrics(tenantId: string) {
    const [
      candidatesPerStage,
      averageStageDuration,
      conversionRate,
      dropOffRate,
      recruiterPerformance,
      pipelineHealth,
    ] = await Promise.all([
      PipelineRepository.getCandidatesPerStage(tenantId),
      PipelineRepository.getAverageStageDuration(tenantId),
      PipelineRepository.getConversionRate(tenantId),
      PipelineRepository.getDropOffRate(tenantId),
      PipelineRepository.getRecruiterPerformance(tenantId),
      PipelineRepository.getPipelineHealth(tenantId),
    ]);

    return {
      candidatesPerStage,
      averageStageDuration,
      conversionRate,
      dropOffRate,
      recruiterPerformance,
      pipelineHealth,
    };
  }

};
