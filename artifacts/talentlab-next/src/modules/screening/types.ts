export type ScreeningVerdict = "SHORTLIST" | "HOLD" | "REJECT";
export type ScreeningMode = "phone" | "video" | "in_person";

export interface ScreeningCriteriaScore {
  id: string;
  screeningId: string;
  criterion: string;
  score: number;
  notes: string | null;
  createdAt: string;
}

export interface ScreeningInterviewer {
  id: string;
  name: string;
  email: string;
}

export interface ScreeningCandidate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface ScreeningJob {
  id: string;
  title: string;
  code: string | null;
}

export interface ScreeningPipeline {
  id: string;
  stage: string;
  candidate: ScreeningCandidate;
  job: ScreeningJob;
}

export interface Screening {
  id: string;
  pipelineId: string;
  interviewerId: string;
  scheduledAt: string;
  mode: ScreeningMode;
  notes: string | null;
  conductedAt: string | null;
  overallScore: number | null;
  verdict: ScreeningVerdict | null;
  recommendation: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  
  // Scorecard values
  communicationScore: number | null;
  technicalScore: number | null;
  experienceScore: number | null;
  salaryAlignScore: number | null;
  noticePeriodScore: number | null;
  personalityScore: number | null;
  
  // Compensation values
  currentCtcDisclosed: number | null;
  expectedCtcDisclosed: number | null;
  noticePeriodDays: number | null;
  canJoinEarlier: boolean | null;

  // Relations
  interviewer?: ScreeningInterviewer | null;
  pipeline?: ScreeningPipeline | null;
  criteriaScores?: ScreeningCriteriaScore[];
}

export interface ScreeningFilters {
  interviewerId?: string;
  verdict?: ScreeningVerdict;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface ScreeningMetrics {
  total: number;
  shortlisted: number;
  rejected: number;
  held: number;
  conducted: number;
  pending: number;
  shortlistRate: number;
  rejectionRate: number;
  averageScore: number;
  byInterviewer: Array<{ interviewerId: string; _count: { id: number } }>;
}

export interface ScheduleScreeningInput {
  pipelineId: string;
  interviewerId?: string;
  scheduledAt: string;
  mode?: ScreeningMode;
}

export interface RescheduleScreeningInput {
  scheduledAt: string;
  interviewerId?: string;
  mode?: ScreeningMode;
}

export interface SubmitScorecardInput {
  scorecard: {
    communicationScore?: number;
    technicalScore?: number;
    experienceScore?: number;
    salaryAlignScore?: number;
    noticePeriodScore?: number;
    personalityScore?: number;
  };
  verdict: ScreeningVerdict;
  recommendation?: string;
  notes?: string;
  conductedAt?: string;
  currentCtcDisclosed?: number;
  expectedCtcDisclosed?: number;
  noticePeriodDays?: number;
  canJoinEarlier?: boolean;
  criteriaScores?: Array<{ criterion: string; score: number; notes?: string }>;
}
