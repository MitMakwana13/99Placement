import { apiClient } from "@/lib/api-client";
import {
  AssessmentQuestion,
  AssessmentTemplate,
  AssessmentTest,
  AssessmentMetrics,
  WeakQuestion,
} from "@/modules/assessment/types";

export const assessmentService = {
  // ── Metrics ───────────────────────────────────────────────────────────────
  getMetrics: async (): Promise<AssessmentMetrics> => {
    return apiClient.get<AssessmentMetrics>("assessments/metrics");
  },

  // ── Templates ─────────────────────────────────────────────────────────────
  listTemplates: async (): Promise<AssessmentTemplate[]> => {
    return apiClient.get<AssessmentTemplate[]>("assessments/templates");
  },

  getTemplateById: async (id: string): Promise<AssessmentTemplate> => {
    return apiClient.get<AssessmentTemplate>(`assessments/templates/${id}`);
  },

  createTemplate: async (data: Omit<AssessmentTemplate, "id" | "tenantId" | "createdAt">): Promise<AssessmentTemplate> => {
    return apiClient.post<AssessmentTemplate>("assessments/templates", data);
  },

  updateTemplate: async (id: string, data: Partial<AssessmentTemplate>): Promise<AssessmentTemplate> => {
    return apiClient.patch<AssessmentTemplate>(`assessments/templates/${id}`, data);
  },

  deleteTemplate: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`assessments/templates/${id}`);
  },

  // ── Questions ─────────────────────────────────────────────────────────────
  listQuestions: async (params?: {
    category?: string;
    difficulty?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: AssessmentQuestion[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> => {
    const query = new URLSearchParams();
    if (params?.category) query.append("category", params.category);
    if (params?.difficulty) query.append("difficulty", params.difficulty);
    if (params?.isActive !== undefined) query.append("isActive", String(params.isActive));
    if (params?.page) query.append("page", String(params.page));
    if (params?.pageSize) query.append("pageSize", String(params.pageSize));

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return apiClient.get<{
      items: AssessmentQuestion[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`assessments/questions${queryString}`);
  },

  getQuestionById: async (id: string): Promise<AssessmentQuestion> => {
    return apiClient.get<AssessmentQuestion>(`assessments/questions/${id}`);
  },

  createQuestion: async (data: {
    category: string;
    questionText: string;
    options: string[];
    correctOption: number;
    difficulty?: string;
  }): Promise<AssessmentQuestion> => {
    return apiClient.post<AssessmentQuestion>("assessments/questions", data);
  },

  updateQuestion: async (
    id: string,
    data: {
      category?: string;
      questionText?: string;
      options?: string[];
      correctOption?: number;
      difficulty?: string;
      isActive?: boolean;
    }
  ): Promise<AssessmentQuestion> => {
    return apiClient.patch<AssessmentQuestion>(`assessments/questions/${id}`, data);
  },

  deleteQuestion: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`assessments/questions/${id}`);
  },

  getWeakQuestions: async (): Promise<WeakQuestion[]> => {
    return apiClient.get<WeakQuestion[]>("assessments/questions/weak");
  },

  // ── Assignments & Executions ─────────────────────────────────────────────
  assignTest: async (data: {
    pipelineId: string;
    templateId?: string;
    conductedById?: string;
    passPercentage?: number;
    durationMinutes?: number;
    scheduledAt?: string;
    questionIds?: string[];
  }): Promise<AssessmentTest> => {
    return apiClient.post<AssessmentTest>("assessments/assign", data);
  },

  listTests: async (params?: {
    pipelineId?: string;
    verdict?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: AssessmentTest[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> => {
    const query = new URLSearchParams();
    if (params?.pipelineId) query.append("pipelineId", params.pipelineId);
    if (params?.verdict) query.append("verdict", params.verdict);
    if (params?.page) query.append("page", String(params.page));
    if (params?.pageSize) query.append("pageSize", String(params.pageSize));

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return apiClient.get<{
      items: AssessmentTest[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`assessments/tests${queryString}`);
  },

  getTestById: async (id: string): Promise<AssessmentTest> => {
    return apiClient.get<AssessmentTest>(`assessments/tests/${id}`);
  },

  getTestForCandidate: async (id: string): Promise<AssessmentTest> => {
    return apiClient.get<AssessmentTest>(`assessments/public/assessments/${id}`);
  },

  getDetailedReportCard: async (id: string): Promise<any> => {
    return apiClient.get<any>(`assessments/tests/${id}/report`);
  },

  startTest: async (id: string): Promise<AssessmentTest> => {
    return apiClient.post<AssessmentTest>(`assessments/public/assessments/${id}/start`, {});
  },

  submitAnswer: async (
    testId: string,
    questionId: string,
    selectedOption: number
  ): Promise<{ success: boolean; isCorrect: boolean }> => {
    return apiClient.post<{ success: boolean; isCorrect: boolean }>(
      `assessments/public/assessments/${testId}/answers`,
      { questionId, selectedOption }
    );
  },

  completeTest: async (id: string): Promise<AssessmentTest> => {
    return apiClient.post<AssessmentTest>(`assessments/public/assessments/${id}/submit`, {});
  },
};
