import { apiClient } from "@/lib/api-client";
import {
  Screening,
  ScreeningFilters,
  ScreeningMetrics,
  ScheduleScreeningInput,
  RescheduleScreeningInput,
  SubmitScorecardInput,
} from "@/modules/screening/types";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const screeningService = {
  schedule: async (data: ScheduleScreeningInput): Promise<Screening> => {
    return apiClient.post<Screening>("screenings", data);
  },

  list: async (filters: ScreeningFilters = {}): Promise<PaginatedResult<Screening>> => {
    const sp = new URLSearchParams();
    if (filters.interviewerId) sp.append("interviewerId", filters.interviewerId);
    if (filters.verdict) sp.append("verdict", filters.verdict);
    if (filters.fromDate) sp.append("fromDate", filters.fromDate);
    if (filters.toDate) sp.append("toDate", filters.toDate);
    if (filters.page) sp.append("page", filters.page.toString());
    if (filters.pageSize) sp.append("pageSize", filters.pageSize.toString());
    
    const query = sp.toString();
    return apiClient.get<PaginatedResult<Screening>>(`screenings${query ? `?${query}` : ""}`);
  },

  findById: async (id: string): Promise<Screening> => {
    return apiClient.get<Screening>(`screenings/${id}`);
  },

  reschedule: async (id: string, data: RescheduleScreeningInput): Promise<Screening> => {
    return apiClient.patch<Screening>(`screenings/${id}/reschedule`, data);
  },

  submitScorecard: async (id: string, data: SubmitScorecardInput): Promise<Screening> => {
    return apiClient.post<Screening>(`screenings/${id}/scorecard`, data);
  },

  cancel: async (id: string, reason?: string): Promise<Screening> => {
    return apiClient.patch<Screening>(`screenings/${id}/cancel`, { reason });
  },

  restore: async (id: string): Promise<Screening> => {
    return apiClient.patch<Screening>(`screenings/${id}/restore`);
  },

  getMetrics: async (): Promise<ScreeningMetrics> => {
    return apiClient.get<ScreeningMetrics>("screenings/metrics");
  },

  findByPipeline: async (pipelineId: string): Promise<Screening[]> => {
    return apiClient.get<Screening[]>(`screenings/pipeline/${pipelineId}`);
  },
};
