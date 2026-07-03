export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  currentRole: string | null;
  experienceYears: number | null;
  location: string | null;
  skills: string | string[] | null;
  source: string | null;
  currentCtc: number | null;
  expectedCtc: number | null;
  noticeDays: number | null;
  summary: string | null;
  initials: string | null;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  notes?: any[];
  documents?: any[];
}

export interface CandidateFilters {
  search?: string;
  source?: string;
  location?: string;
  limit?: number;
  offset?: number;
}
