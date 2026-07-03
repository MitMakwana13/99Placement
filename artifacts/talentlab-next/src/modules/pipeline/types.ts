export interface PipelineItem {
  id: string;
  candidateId: string;
  jobId: string;
  stage: string;
  stageUpdatedAt: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  notes?: string | null;
  candidate: {
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
  };
  job: {
    id: string;
    title: string;
    code: string;
    urgency: "CRITICAL" | "HIGH" | "NORMAL";
    status: string;
    jobType: string;
    companyId: string;
    company?: {
      id: string;
      name: string;
    } | null;
  };
  assignedRecruiter?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  pipelineNotes?: Array<{
    id: string;
    content: string;
    createdAt: string;
    isPrivate: boolean;
    author: {
      id: string;
      name: string;
    };
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    fileUrl: string;
    fileSize: number | null;
    uploadedAt: string;
    uploadedBy?: {
      id: string;
      name: string;
    } | null;
  }>;
  ratings?: Array<{
    id: string;
    recruiterRating: number | null;
    technicalRating: number | null;
    hrRating: number | null;
    overallRating: number | null;
    feedback: string | null;
    updatedAt: string;
    ratedBy: {
      id: string;
      name: string;
    };
  }>;
  checklists?: Array<{
    id: string;
    itemKey: string;
    title: string;
    isCompleted: boolean;
    completedAt?: string | null;
    completedBy?: {
      id: string;
      name: string;
    } | null;
  }>;
  reminders?: Array<{
    id: string;
    title: string;
    description: string | null;
    reminderType: string;
    remindAt: string;
    isCompleted: boolean;
  }>;
  tags?: Array<{
    id: string;
    name: string;
  }>;
  histories?: Array<{
    id: string;
    oldStage: string | null;
    newStage: string;
    reason: string | null;
    changedAt: string;
    changedBy?: {
      id: string;
      name: string;
    } | null;
  }>;
}

export interface PipelineFilters {
  search?: string;
  jobId?: string;
  companyId?: string;
  assignedRecruiterId?: string;
  priority?: "CRITICAL" | "HIGH" | "NORMAL";
  source?: string;
  tag?: string;
  showArchived?: boolean;
}
