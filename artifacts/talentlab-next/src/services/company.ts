import { apiClient } from "@/lib/api-client";
import {
  Company,
  CompanyPaginatedResult,
  CompanyFilters,
  CompanyContact,
  CompanyNote,
  CompanyDocument,
  CompanyDepartment,
  CompanyTimelineEvent,
  CreateCompanyInput,
  UpdateCompanyInput,
  CreateContactInput,
  AddNoteInput,
  AddDocumentInput,
} from "@/modules/company/types";

// ─── Query String Builder ─────────────────────────────────────────────────────

function buildQueryString(params: Record<string, any>): string {
  const sp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== "") {
      sp.append(key, String(val));
    }
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const companyService = {
  // ── Core CRUD ────────────────────────────────────────────────────────────

  list: async (filters: CompanyFilters = {}): Promise<CompanyPaginatedResult> => {
    const qs = buildQueryString(filters);
    return apiClient.get<CompanyPaginatedResult>(`companies${qs}`);
  },

  findById: async (id: string): Promise<Company> => {
    return apiClient.get<Company>(`companies/${id}`);
  },

  create: async (data: CreateCompanyInput): Promise<Company> => {
    return apiClient.post<Company>("companies", data);
  },

  update: async (id: string, data: UpdateCompanyInput): Promise<Company> => {
    return apiClient.patch<Company>(`companies/${id}`, data);
  },

  archive: async (id: string): Promise<Company> => {
    return apiClient.patch<Company>(`companies/${id}/archive`, {});
  },

  restore: async (id: string): Promise<Company> => {
    return apiClient.patch<Company>(`companies/${id}/restore`, {});
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`companies/${id}`);
  },

  // ── Contacts ─────────────────────────────────────────────────────────────

  getContacts: async (id: string): Promise<CompanyContact[]> => {
    return apiClient.get<CompanyContact[]>(`companies/${id}/contacts`);
  },

  addContact: async (id: string, data: CreateContactInput): Promise<CompanyContact> => {
    return apiClient.post<CompanyContact>(`companies/${id}/contacts`, data);
  },

  updateContact: async (
    id: string,
    contactId: string,
    data: Partial<CreateContactInput>
  ): Promise<CompanyContact> => {
    return apiClient.patch<CompanyContact>(`companies/${id}/contacts/${contactId}`, data);
  },

  deleteContact: async (id: string, contactId: string): Promise<void> => {
    return apiClient.delete<void>(`companies/${id}/contacts/${contactId}`);
  },

  // ── Notes ────────────────────────────────────────────────────────────────

  getNotes: async (id: string): Promise<CompanyNote[]> => {
    return apiClient.get<CompanyNote[]>(`companies/${id}/notes`);
  },

  addNote: async (id: string, data: AddNoteInput): Promise<CompanyNote> => {
    return apiClient.post<CompanyNote>(`companies/${id}/notes`, data);
  },

  // ── Documents ────────────────────────────────────────────────────────────

  getDocuments: async (id: string): Promise<CompanyDocument[]> => {
    return apiClient.get<CompanyDocument[]>(`companies/${id}/documents`);
  },

  addDocument: async (id: string, data: AddDocumentInput): Promise<CompanyDocument> => {
    return apiClient.post<CompanyDocument>(`companies/${id}/documents`, data);
  },

  // ── Departments ──────────────────────────────────────────────────────────

  getDepartments: async (id: string): Promise<CompanyDepartment[]> => {
    return apiClient.get<CompanyDepartment[]>(`companies/${id}/departments`);
  },

  addDepartment: async (
    id: string,
    data: { name: string; headName?: string; headEmail?: string; description?: string }
  ): Promise<CompanyDepartment> => {
    return apiClient.post<CompanyDepartment>(`companies/${id}/departments`, data);
  },

  // ── Recruiters ───────────────────────────────────────────────────────────

  assignRecruiter: async (
    id: string,
    userId: string,
    isLead?: boolean
  ): Promise<any> => {
    return apiClient.post(`companies/${id}/recruiters`, { userId, isLead: isLead ?? false });
  },

  removeRecruiter: async (id: string, userId: string): Promise<void> => {
    return apiClient.delete<void>(`companies/${id}/recruiters/${userId}`);
  },

  // ── Timeline ─────────────────────────────────────────────────────────────

  getTimeline: async (id: string): Promise<CompanyTimelineEvent[]> => {
    return apiClient.get<CompanyTimelineEvent[]>(`companies/${id}/timeline`);
  },
};
