import { apiClient } from "@/lib/api-client";

export const offerService = {
  list: async (): Promise<any[]> => {
    return apiClient.get<any[]>("offers");
  },

  create: async (data: any): Promise<any> => {
    return apiClient.post<any>("offers", data);
  },

  updateStatus: async (offerId: string, status: string): Promise<any> => {
    return apiClient.patch<any>(`offers/${offerId}/status`, { status });
  },
};
