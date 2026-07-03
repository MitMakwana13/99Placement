import { prisma, Company, Prisma } from "@workspace/db-prisma";
import { AppError } from "../utils/app-error";
import { CompanyRepository } from "../repositories/company.repository";
import { domainEventBus } from "../events/event-bus";
import {
  CompanyCreatedEvent,
  CompanyUpdatedEvent,
  CompanyArchivedEvent,
  CompanyRestoredEvent,
  CompanyMergedEvent,
  RecruiterAssignedEvent,
  ContactCreatedEvent,
} from "../events/company/company.events";
import { logger } from "../config/logger";

// ─── Input interfaces ─────────────────────────────────────────────────────────

export interface CreateCompanyInput {
  name: string;
  industry?: string;
  website?: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  email?: string;
  phone?: string;
  employeeCount?: number;
  companyType?: string;
  logoUrl?: string;
  description?: string;
  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    addressType?: string;
  };
  contacts?: Array<{
    name: string;
    email?: string;
    phone?: string;
    designation?: string;
    contactType?: string;
    linkedinUrl?: string;
    notes?: string;
    isPrimary?: boolean;
  }>;
  departments?: Array<{
    name: string;
    headName?: string;
    headEmail?: string;
    description?: string;
  }>;
  tags?: string[];
}

export interface UpdateCompanyInput extends Partial<CreateCompanyInput> {}

// ─── Service ──────────────────────────────────────────────────────────────────

export class CompanyService {

  // ── Create ──────────────────────────────────────────────────────────────────

  static async createCompany(
    tenantId: string,
    input: CreateCompanyInput,
    performedById?: string
  ): Promise<Company> {
    // 1. Duplicate name check
    const existingName = await CompanyRepository.findByName(tenantId, input.name);
    if (existingName) {
      throw AppError.conflict(
        `A company named "${input.name}" already exists in your workspace.`,
        "DUPLICATE_COMPANY_NAME"
      );
    }

    // 2. Duplicate GSTIN check
    if (input.gstin) {
      const existingGstin = await CompanyRepository.findByGstin(tenantId, input.gstin);
      if (existingGstin) {
        throw AppError.conflict(
          "A company with this GSTIN already exists.",
          "DUPLICATE_GSTIN"
        );
      }
    }

    // 3. Duplicate email check
    if (input.email) {
      const existingEmail = await CompanyRepository.findByEmail(tenantId, input.email);
      if (existingEmail) {
        throw AppError.conflict(
          "A company with this email already exists.",
          "DUPLICATE_COMPANY_EMAIL"
        );
      }
    }

    // 4. Duplicate phone check
    if (input.phone) {
      const existingPhone = await CompanyRepository.findByPhone(tenantId, input.phone);
      if (existingPhone) {
        throw AppError.conflict(
          "A company with this phone number already exists.",
          "DUPLICATE_COMPANY_PHONE"
        );
      }
    }

    // 5. Transactional creation
    const company = await prisma.$transaction(async (tx) => {
      const created = await tx.company.create({
        data: {
          tenantId,
          name: input.name,
          industry: input.industry,
          website: input.website,
          gstin: input.gstin,
          pan: input.pan,
          cin: input.cin,
          email: input.email,
          phone: input.phone,
          employeeCount: input.employeeCount,
          companyType: input.companyType || "PRIVATE_LIMITED",
          logoUrl: input.logoUrl,
          description: input.description,
        },
      });

      if (input.address) {
        await tx.companyAddress.create({
          data: { ...input.address, tenantId, companyId: created.id },
        });
      }

      if (input.contacts && input.contacts.length > 0) {
        await tx.companyContact.createMany({
          data: input.contacts.map((c) => ({ ...c, tenantId, companyId: created.id })),
        });
      }

      if (input.departments && input.departments.length > 0) {
        await tx.companyDepartment.createMany({
          data: input.departments.map((d) => ({ ...d, tenantId, companyId: created.id })),
        });
      }

      if (input.tags && input.tags.length > 0) {
        await tx.companyTag.createMany({
          data: input.tags.map((name) => ({ name, tenantId, companyId: created.id })),
        });
      }

      return created;
    });

    // 6. Publish event (awaited)
    await domainEventBus.publish(
      new CompanyCreatedEvent(tenantId, company.id, performedById)
    );

    return company;
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  static async updateCompany(
    tenantId: string,
    id: string,
    input: UpdateCompanyInput,
    performedById?: string
  ): Promise<Company> {
    const existing = await CompanyRepository.findById(tenantId, id);
    if (!existing) throw AppError.notFound("Company not found.");

    // Duplicate checks for changed unique fields
    if (input.name && input.name !== existing.name) {
      const dup = await CompanyRepository.findByName(tenantId, input.name);
      if (dup && dup.id !== id)
        throw AppError.conflict("A company with this name already exists.", "DUPLICATE_COMPANY_NAME");
    }
    if (input.gstin && input.gstin !== existing.gstin) {
      const dup = await CompanyRepository.findByGstin(tenantId, input.gstin);
      if (dup && dup.id !== id)
        throw AppError.conflict("A company with this GSTIN already exists.", "DUPLICATE_GSTIN");
    }
    if (input.email && input.email !== existing.email) {
      const dup = await CompanyRepository.findByEmail(tenantId, input.email);
      if (dup && dup.id !== id)
        throw AppError.conflict("A company with this email already exists.", "DUPLICATE_COMPANY_EMAIL");
    }
    if (input.phone && input.phone !== existing.phone) {
      const dup = await CompanyRepository.findByPhone(tenantId, input.phone);
      if (dup && dup.id !== id)
        throw AppError.conflict("A company with this phone already exists.", "DUPLICATE_COMPANY_PHONE");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const core = await tx.company.update({
        where: { id, tenantId },
        data: {
          name: input.name,
          industry: input.industry,
          website: input.website,
          gstin: input.gstin,
          pan: input.pan,
          cin: input.cin,
          email: input.email,
          phone: input.phone,
          employeeCount: input.employeeCount,
          companyType: input.companyType as any,
          logoUrl: input.logoUrl,
          description: input.description,
        },
      });

      if (input.address) {
        await tx.companyAddress.upsert({
          where: { companyId: id },
          create: { ...input.address, tenantId, companyId: id },
          update: input.address,
        });
      }

      if (input.tags !== undefined) {
        await tx.companyTag.deleteMany({ where: { companyId: id, tenantId } });
        if (input.tags.length > 0) {
          await tx.companyTag.createMany({
            data: input.tags.map((name) => ({ name, tenantId, companyId: id })),
          });
        }
      }

      return core;
    });

    // Detect changes for timeline
    const changes: Record<string, any> = {};
    const watchFields: (keyof UpdateCompanyInput)[] = ["name", "industry", "website", "gstin", "email", "phone", "description"];
    for (const field of watchFields) {
      if (input[field] !== undefined && (input[field] as any) !== (existing as any)[field]) {
        changes[field] = { old: (existing as any)[field], new: input[field] };
      }
    }

    await domainEventBus.publish(
      new CompanyUpdatedEvent(tenantId, id, changes, performedById)
    );

    return updated;
  }

  // ── Archive / Restore ────────────────────────────────────────────────────────

  static async archiveCompany(
    tenantId: string,
    id: string,
    performedById?: string
  ): Promise<Company> {
    const company = await CompanyRepository.findById(tenantId, id);
    if (!company) throw AppError.notFound("Company not found.");

    // Archive protection: check if company has open jobs
    const openJobs = await prisma.job.count({
      where: { companyId: id, tenantId, status: { in: ["OPEN", "ON_HOLD"] } },
    });
    if (openJobs > 0) {
      throw AppError.conflict(
        `Cannot archive this company — it has ${openJobs} active/on-hold job(s). Close all jobs before archiving.`,
        "COMPANY_HAS_OPEN_JOBS"
      );
    }

    const archived = await CompanyRepository.archive(tenantId, id);
    await domainEventBus.publish(new CompanyArchivedEvent(tenantId, id, performedById));
    return archived;
  }

  static async restoreCompany(
    tenantId: string,
    id: string,
    performedById?: string
  ): Promise<Company> {
    const company = await CompanyRepository.findById(tenantId, id, true);
    if (!company) throw AppError.notFound("Company not found (including archived).");

    const restored = await CompanyRepository.restore(tenantId, id);
    await domainEventBus.publish(new CompanyRestoredEvent(tenantId, id, performedById));
    return restored;
  }

  // ── Permanent Delete ─────────────────────────────────────────────────────────

  static async permanentDeleteCompany(tenantId: string, id: string): Promise<Company> {
    const company = await CompanyRepository.findByIdIncludeDeleted(tenantId, id);
    if (!company) throw AppError.notFound("Company not found.");
    return CompanyRepository.permanentDelete(tenantId, id);
  }

  // ── Merge ─────────────────────────────────────────────────────────────────────

  static async mergeCompanies(
    tenantId: string,
    sourceCompanyId: string,
    targetCompanyId: string,
    performedById?: string
  ): Promise<Company> {
    if (sourceCompanyId === targetCompanyId)
      throw AppError.badRequest("Source and target companies cannot be the same.");

    const source = await CompanyRepository.findById(tenantId, sourceCompanyId);
    const target = await CompanyRepository.findById(tenantId, targetCompanyId);
    if (!source || !target) throw AppError.notFound("One or both companies not found.");

    await prisma.$transaction(async (tx) => {
      // Transfer contacts
      await tx.companyContact.updateMany({
        where: { companyId: sourceCompanyId, tenantId },
        data: { companyId: targetCompanyId },
      });

      // Transfer departments
      await tx.companyDepartment.updateMany({
        where: { companyId: sourceCompanyId, tenantId },
        data: { companyId: targetCompanyId },
      });

      // Transfer documents
      await tx.companyDocument.updateMany({
        where: { companyId: sourceCompanyId, tenantId },
        data: { companyId: targetCompanyId },
      });

      // Transfer notes
      await tx.companyNote.updateMany({
        where: { companyId: sourceCompanyId, tenantId },
        data: { companyId: targetCompanyId },
      });

      // Transfer tags (deduplicate)
      const sourceTags = source.tags.map((t) => t.name);
      const targetTagNames = target.tags.map((t) => t.name.toLowerCase());
      const newTags = sourceTags.filter((t) => !targetTagNames.includes(t.toLowerCase()));
      if (newTags.length > 0) {
        await tx.companyTag.createMany({
          data: newTags.map((name) => ({ name, tenantId, companyId: targetCompanyId })),
          skipDuplicates: true,
        });
      }
      await tx.companyTag.deleteMany({ where: { companyId: sourceCompanyId, tenantId } });

      // Transfer jobs
      await tx.job.updateMany({
        where: { companyId: sourceCompanyId, tenantId },
        data: { companyId: targetCompanyId },
      });

      // Transfer timeline
      await tx.companyTimeline.updateMany({
        where: { companyId: sourceCompanyId, tenantId },
        data: { companyId: targetCompanyId },
      });

      // Soft-delete source
      await tx.company.update({
        where: { id: sourceCompanyId, tenantId },
        data: { deletedAt: new Date() },
      });
    });

    await domainEventBus.publish(
      new CompanyMergedEvent(tenantId, sourceCompanyId, targetCompanyId, performedById)
    );

    const finalTarget = await CompanyRepository.findById(tenantId, targetCompanyId);
    if (!finalTarget) throw AppError.notFound("Merged company not found.");
    return finalTarget;
  }

  // ── Recruiter Assignment ──────────────────────────────────────────────────────

  static async assignRecruiter(
    tenantId: string,
    companyId: string,
    userId: string,
    isLead: boolean,
    performedById?: string
  ) {
    const company = await CompanyRepository.findById(tenantId, companyId);
    if (!company) throw AppError.notFound("Company not found.");

    const assignment = await prisma.recruiterAssignment.upsert({
      where: { tenantId_companyId_userId: { tenantId, companyId, userId } },
      create: { tenantId, companyId, userId, isLead, assignedById: performedById },
      update: { isLead },
    });

    await domainEventBus.publish(
      new RecruiterAssignedEvent(tenantId, companyId, userId, isLead, performedById)
    );

    return assignment;
  }

  static async removeRecruiter(tenantId: string, companyId: string, userId: string) {
    const company = await CompanyRepository.findById(tenantId, companyId);
    if (!company) throw AppError.notFound("Company not found.");

    return prisma.recruiterAssignment.delete({
      where: { tenantId_companyId_userId: { tenantId, companyId, userId } },
    });
  }

  // ── Contacts ──────────────────────────────────────────────────────────────────

  static async addContact(
    tenantId: string,
    companyId: string,
    input: {
      name: string;
      email?: string;
      phone?: string;
      designation?: string;
      contactType?: string;
      linkedinUrl?: string;
      notes?: string;
      isPrimary?: boolean;
    },
    performedById?: string
  ) {
    const company = await CompanyRepository.findById(tenantId, companyId);
    if (!company) throw AppError.notFound("Company not found.");

    // If new contact is primary, demote existing primary
    if (input.isPrimary) {
      await prisma.companyContact.updateMany({
        where: { companyId, tenantId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.companyContact.create({
      data: { ...input, tenantId, companyId },
    });

    await domainEventBus.publish(
      new ContactCreatedEvent(tenantId, companyId, contact.id, performedById)
    );

    return contact;
  }

  static async updateContact(
    tenantId: string,
    companyId: string,
    contactId: string,
    input: Partial<{
      name: string;
      email?: string;
      phone?: string;
      designation?: string;
      contactType?: string;
      linkedinUrl?: string;
      notes?: string;
      isPrimary?: boolean;
    }>
  ) {
    const existing = await prisma.companyContact.findFirst({
      where: { id: contactId, companyId, tenantId, deletedAt: null },
    });
    if (!existing) throw AppError.notFound("Contact not found.");

    if (input.isPrimary) {
      await prisma.companyContact.updateMany({
        where: { companyId, tenantId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return prisma.companyContact.update({
      where: { id: contactId },
      data: input,
    });
  }

  static async removeContact(tenantId: string, companyId: string, contactId: string) {
    const existing = await prisma.companyContact.findFirst({
      where: { id: contactId, companyId, tenantId, deletedAt: null },
    });
    if (!existing) throw AppError.notFound("Contact not found.");

    return prisma.companyContact.update({
      where: { id: contactId },
      data: { deletedAt: new Date() },
    });
  }

  static async getContacts(tenantId: string, companyId: string) {
    const company = await CompanyRepository.findById(tenantId, companyId);
    if (!company) throw AppError.notFound("Company not found.");
    return prisma.companyContact.findMany({
      where: { companyId, tenantId, deletedAt: null },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
  }

  // ── Notes ─────────────────────────────────────────────────────────────────────

  static async addNote(
    tenantId: string,
    companyId: string,
    content: string,
    isPrivate: boolean,
    authorId?: string
  ) {
    const company = await CompanyRepository.findById(tenantId, companyId);
    if (!company) throw AppError.notFound("Company not found.");

    return prisma.companyNote.create({
      data: { tenantId, companyId, content, isPrivate, authorId },
    });
  }

  static async getNotes(tenantId: string, companyId: string) {
    const company = await CompanyRepository.findById(tenantId, companyId);
    if (!company) throw AppError.notFound("Company not found.");

    return prisma.companyNote.findMany({
      where: { companyId, tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ── Documents ────────────────────────────────────────────────────────────────

  static async addDocument(
    tenantId: string,
    companyId: string,
    input: {
      name: string;
      documentType: string;
      fileUrl: string;
      fileKey?: string;
      fileSize?: number;
      checksum?: string;
    }
  ) {
    const company = await CompanyRepository.findById(tenantId, companyId);
    if (!company) throw AppError.notFound("Company not found.");

    return prisma.companyDocument.create({
      data: { ...input, tenantId, companyId },
    });
  }

  static async getDocuments(tenantId: string, companyId: string) {
    const company = await CompanyRepository.findById(tenantId, companyId);
    if (!company) throw AppError.notFound("Company not found.");

    return prisma.companyDocument.findMany({
      where: { companyId, tenantId },
      orderBy: { uploadedAt: "desc" },
    });
  }

  // ── Departments ───────────────────────────────────────────────────────────────

  static async addDepartment(
    tenantId: string,
    companyId: string,
    input: { name: string; headName?: string; headEmail?: string; description?: string }
  ) {
    const company = await CompanyRepository.findById(tenantId, companyId);
    if (!company) throw AppError.notFound("Company not found.");

    return prisma.companyDepartment.create({
      data: { ...input, tenantId, companyId },
    });
  }

  static async getDepartments(tenantId: string, companyId: string) {
    const company = await CompanyRepository.findById(tenantId, companyId);
    if (!company) throw AppError.notFound("Company not found.");

    return prisma.companyDepartment.findMany({
      where: { companyId, tenantId },
      orderBy: { name: "asc" },
    });
  }

  // ── Timeline ──────────────────────────────────────────────────────────────────

  static async getTimeline(tenantId: string, companyId: string) {
    const company = await CompanyRepository.findById(tenantId, companyId, true);
    if (!company) throw AppError.notFound("Company not found.");

    return prisma.companyTimeline.findMany({
      where: { companyId, tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        performedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ── Saved Filters ─────────────────────────────────────────────────────────────

  static async saveFilter(
    tenantId: string,
    userId: string,
    name: string,
    filters: Record<string, any>
  ) {
    return CompanyRepository.saveFilter(tenantId, userId, name, filters);
  }

  static async getFilters(tenantId: string, userId: string) {
    return CompanyRepository.getFilters(tenantId, userId);
  }
}
