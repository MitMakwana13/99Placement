import { Candidate } from "@workspace/db-prisma";
import { CandidateCommandService } from "./candidate.command.service";
import { CandidateQueryService } from "./candidate.query.service";

export interface CreateCandidateInput {
  name: string;
  email: string;
  phone?: string;
  currentRole?: string;
  experienceYears?: number;
  location?: string;
  skills?: string[];
  source?: string;
  currentCtc?: number;
  expectedCtc?: number;
  noticeDays?: number;
  summary?: string;
  resumeUrl?: string;
  photoUrl?: string;

  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType?: string;
  };
  educations?: Array<{
    degree: string;
    fieldOfStudy: string;
    institution: string;
    startDate: Date;
    endDate?: Date;
    percentage?: number;
    cgpa?: number;
    isCompleted?: boolean;
  }>;
  experiences?: Array<{
    company: string;
    title: string;
    location?: string;
    startDate: Date;
    endDate?: Date;
    isCurrent?: boolean;
    description?: string;
  }>;
  skillsList?: Array<{
    name: string;
    rating?: number;
    yearsOfExperience?: number;
  }>;
  languages?: Array<{
    language: string;
    proficiency: string;
  }>;
  certifications?: Array<{
    name: string;
    issuingOrganization: string;
    issueDate?: Date;
    expiryDate?: Date;
    credentialId?: string;
    credentialUrl?: string;
  }>;
  documents?: Array<{
    name: string;
    documentType: string;
    fileUrl: string;
    fileKey?: string;
    fileSize?: number;
    checksum?: string;
  }>;
  tags?: string[];
}

export interface UpdateCandidateInput extends Partial<CreateCandidateInput> {}

/**
 * CandidateService Facade to retain backward compatibility while implementing CQRS
 */
export class CandidateService {
  static createCandidate(
    tenantId: string,
    input: CreateCandidateInput,
    performedById?: string
  ): Promise<Candidate> {
    return CandidateCommandService.createCandidate(tenantId, input, performedById);
  }

  static updateCandidate(
    tenantId: string,
    id: string,
    input: UpdateCandidateInput,
    performedById?: string
  ): Promise<Candidate> {
    return CandidateCommandService.updateCandidate(tenantId, id, input, performedById);
  }

  static softDeleteCandidate(
    tenantId: string,
    id: string,
    performedById?: string
  ): Promise<Candidate> {
    return CandidateCommandService.softDeleteCandidate(tenantId, id, performedById);
  }

  static restoreCandidate(
    tenantId: string,
    id: string,
    performedById?: string
  ): Promise<Candidate> {
    return CandidateCommandService.restoreCandidate(tenantId, id, performedById);
  }

  static permanentDeleteCandidate(
    tenantId: string,
    id: string
  ): Promise<Candidate> {
    return CandidateCommandService.permanentDeleteCandidate(tenantId, id);
  }

  static mergeCandidates(
    tenantId: string,
    sourceCandidateId: string,
    targetCandidateId: string,
    performedById?: string
  ): Promise<Candidate> {
    return CandidateCommandService.mergeCandidates(tenantId, sourceCandidateId, targetCandidateId, performedById);
  }

  // CQRS Query forwards
  static getCandidateById(
    tenantId: string,
    id: string,
    includeDeleted = false
  ): Promise<any> {
    return CandidateQueryService.getCandidateById(tenantId, id, includeDeleted);
  }

  static getCandidateByEmail(tenantId: string, email: string): Promise<Candidate | null> {
    return CandidateQueryService.getCandidateByEmail(tenantId, email);
  }

  static getCandidateByPhone(tenantId: string, phone: string): Promise<Candidate | null> {
    return CandidateQueryService.getCandidateByPhone(tenantId, phone);
  }

  static queryCandidates(
    tenantId: string,
    filters: any,
    pagination: any
  ): Promise<any> {
    return CandidateQueryService.queryCandidates(tenantId, filters, pagination);
  }

  static getSavedFilters(tenantId: string, userId: string): Promise<any> {
    return CandidateQueryService.getSavedFilters(tenantId, userId);
  }
}
