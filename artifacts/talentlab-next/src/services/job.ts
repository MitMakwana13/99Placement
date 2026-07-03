import { apiClient } from "@/lib/api-client";
import { Job, JobFilters } from "@/modules/job/types";

export const jobService = {
  list: async (params?: JobFilters): Promise<Job[]> => {
    let queryStr = "";
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.append("search", params.search);
      if (params.status) searchParams.append("status", params.status);
      if (params.jobType) searchParams.append("jobType", params.jobType);
      if (params.urgency) searchParams.append("urgency", params.urgency);
      if (params.limit) searchParams.append("limit", params.limit.toString());
      if (params.offset) searchParams.append("offset", params.offset.toString());
      queryStr = `?${searchParams.toString()}`;
    }
    return apiClient.get<Job[]>(`jobs${queryStr}`);
  },

  findById: async (id: string): Promise<Job> => {
    return apiClient.get<Job>(`jobs/${id}`);
  },

  create: async (data: any): Promise<Job> => {
    return apiClient.post<Job>("jobs", data);
  },

  update: async (id: string, data: any): Promise<Job> => {
    return apiClient.put<Job>(`jobs/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    // Delete endpoint in job.routes.ts maps to delete(/:id/permanent) or post(/:id/archive)
    // Let's use permanent delete for cleanliness or support normal delete
    return apiClient.delete<void>(`jobs/${id}/permanent`);
  },

  archive: async (id: string): Promise<Job> => {
    return apiClient.post<Job>(`jobs/${id}/archive`);
  },

  restore: async (id: string): Promise<Job> => {
    return apiClient.post<Job>(`jobs/${id}/restore`);
  },
};
