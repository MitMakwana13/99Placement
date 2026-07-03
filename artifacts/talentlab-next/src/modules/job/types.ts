export interface Job {
  id: string;
  companyId: string;
  title: string;
  code: string | null;
  description: string | null;
  location: string;
  jobType: "full_time" | "part_time" | "contract" | "internship" | "freelance";
  urgency: "CRITICAL" | "HIGH" | "NORMAL";
  salaryBand: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  minExperience: number | null;
  maxExperience: number | null;
  jdText: string | null;
  openingsCount: number;
  deadline: string | null;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "OPEN" | "ON_HOLD" | "CLOSED" | "CANCELLED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string | null;
  company?: {
    id: string;
    name: string;
  };
  departments?: Array<{ id: string; name: string }>;
  locations?: Array<{ id: string; city: string; state: string | null; country: string }>;
  requirements?: Array<{ id: string; description: string; isRequired: boolean }>;
  skills?: Array<{ id: string; name: string; isRequired: boolean }>;
  questions?: Array<{ id: string; questionText: string; questionType: string; options: string[]; isRequired: boolean }>;
  tags?: Array<{ id: string; name: string }>;
  documents?: Array<{ id: string; name: string; documentType: string; fileUrl: string; fileSize: number | null }>;
  recruiters?: Array<{ userId: string; user?: { id: string; name: string; email: string } }>;
  hiringManagers?: Array<{ userId: string; user?: { id: string; name: string; email: string } }>;
  statusHistory?: Array<{ id: string; oldStatus: string | null; newStatus: string; changedAt: string; reason: string | null; changedBy?: { id: string; name: string } | null }>;
}

export interface JobFilters {
  search?: string;
  status?: Job["status"];
  jobType?: Job["jobType"];
  urgency?: Job["urgency"];
  limit?: number;
  offset?: number;
}
