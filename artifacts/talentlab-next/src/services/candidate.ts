import { apiClient } from "@/lib/api-client";
import { Candidate } from "@/modules/candidate/types";

export const candidateService = {
  list: async (params?: { search?: string; source?: string; location?: string; limit?: number; offset?: number }): Promise<Candidate[]> => {
    let queryStr = "";
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.append("search", params.search);
      if (params.source) searchParams.append("source", params.source);
      if (params.location) searchParams.append("location", params.location);
      if (params.limit) searchParams.append("limit", params.limit.toString());
      if (params.offset) searchParams.append("offset", params.offset.toString());
      queryStr = `?${searchParams.toString()}`;
    }
    return apiClient.get<Candidate[]>(`candidates${queryStr}`);
  },

  findById: async (id: string): Promise<Candidate> => {
    return apiClient.get<Candidate>(`candidates/${id}`);
  },

  create: async (data: any): Promise<Candidate> => {
    return apiClient.post<Candidate>("candidates", data);
  },

  update: async (id: string, data: any): Promise<Candidate> => {
    return apiClient.patch<Candidate>(`candidates/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`candidates/${id}`);
  },

  addNote: async (id: string, content: string, isPrivate: boolean = false): Promise<any> => {
    return apiClient.post<any>(`candidates/${id}/notes`, { content, isPrivate });
  },

  addDocument: async (id: string, doc: { name: string; documentType: string; fileUrl: string; fileKey?: string; fileSize?: number }): Promise<any> => {
    return apiClient.post<any>(`candidates/${id}/documents`, doc);
  },

  getTimeline: async (id: string): Promise<any[]> => {
    return apiClient.get<any[]>(`candidates/${id}/timeline`);
  },
};
