import { apiClient } from "@/lib/api-client";
import { LoginInput, RegisterTenantInput } from "@workspace/shared-schemas";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  companyId?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export const authService = {
  login: async (data: LoginInput): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>("auth/login", data);
  },

  registerTenant: async (data: RegisterTenantInput): Promise<any> => {
    return apiClient.post<any>("auth/register-tenant", data);
  },

  forgotPassword: async (email: string): Promise<any> => {
    return apiClient.post<any>("auth/forgot-password", { email });
  },

  resetPassword: async (data: any): Promise<any> => {
    return apiClient.post<any>("auth/reset-password", data);
  },

  me: async (): Promise<AuthUser> => {
    return apiClient.get<AuthUser>("auth/me");
  },
};
