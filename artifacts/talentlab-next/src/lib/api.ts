/**
 * Axios-compatible wrapper around apiClient for workspace settings pages.
 * Maps apiClient results to a `{ data: response }` structure.
 */
import { apiClient } from "./api-client";

export const api = {
  get: async (endpoint: string, options?: any) => {
    const res = await apiClient.get<any>(endpoint, options);
    return { data: res };
  },
  post: async (endpoint: string, body?: any, options?: any) => {
    const res = await apiClient.post<any>(endpoint, body, options);
    return { data: res };
  },
  put: async (endpoint: string, body?: any, options?: any) => {
    const res = await apiClient.put<any>(endpoint, body, options);
    return { data: res };
  },
  patch: async (endpoint: string, body?: any, options?: any) => {
    const res = await apiClient.patch<any>(endpoint, body, options);
    return { data: res };
  },
  delete: async (endpoint: string, options?: any) => {
    const res = await apiClient.delete<any>(endpoint, options);
    return { data: res };
  }
};
