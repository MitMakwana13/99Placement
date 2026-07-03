import { apiClient } from "@/lib/api-client";
import { PipelineItem } from "@/modules/pipeline/types";

export interface PipelineListResponse {
  items: PipelineItem[];
  nextCursor?: string;
}

export const pipelineService = {
  list: async (filters?: { search?: string; jobId?: string; stage?: string; assignedRecruiterId?: string }): Promise<PipelineListResponse> => {
    let queryStr = "";
    if (filters) {
      const searchParams = new URLSearchParams();
      if (filters.search) searchParams.append("search", filters.search);
      if (filters.jobId) searchParams.append("jobId", filters.jobId);
      if (filters.stage) searchParams.append("stage", filters.stage);
      if (filters.assignedRecruiterId) searchParams.append("assignedRecruiterId", filters.assignedRecruiterId);
      queryStr = `?${searchParams.toString()}`;
    }
    return apiClient.get<PipelineListResponse>(`pipelines${queryStr}`);
  },

  updateStage: async (id: string, stage: string): Promise<PipelineItem> => {
    return apiClient.patch<PipelineItem>(`pipelines/${id}/stage`, { newStage: stage });
  },

  updateChecklistItem: async (id: string, itemKey: string, isCompleted: boolean): Promise<any> => {
    return apiClient.patch<any>(`pipelines/${id}/checklist/${itemKey}`, { isCompleted });
  },

  getStats: async (): Promise<any> => {
    return apiClient.get<any>("pipelines/metrics");
  },
};
