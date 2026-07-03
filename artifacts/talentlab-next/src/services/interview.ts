import { apiClient } from "@/lib/api-client";

export const interviewService = {
  list: async (): Promise<any[]> => {
    return apiClient.get<any[]>("interviews");
  },

  schedule: async (data: any): Promise<any> => {
    return apiClient.post<any>("interviews/schedule", data);
  },

  submitFeedback: async (interviewId: string, feedback: any): Promise<any> => {
    return apiClient.post<any>(`interviews/${interviewId}/feedback`, feedback);
  },
};
