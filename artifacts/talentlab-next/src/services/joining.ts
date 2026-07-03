import { apiClient } from "@/lib/api-client";

export const joiningService = {
  list: async (): Promise<any[]> => {
    return apiClient.get<any[]>("joining");
  },

  updateStatus: async (pipelineId: string, data: any): Promise<any> => {
    return apiClient.put<any>(`joining/${pipelineId}`, data);
  },
};
