import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assessmentService } from "@/services/assessment";

export function useAssessmentTests(params?: {
  pipelineId?: string;
  verdict?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["assessment", "tests", params],
    queryFn: () => assessmentService.listTests(params),
  });
}

export function useAssessmentTest(id: string) {
  return useQuery({
    queryKey: ["assessment", "tests", id],
    queryFn: () => assessmentService.getTestById(id),
    enabled: !!id,
  });
}

export function useCandidateTest(id: string) {
  return useQuery({
    queryKey: ["assessment", "candidate-test", id],
    queryFn: () => assessmentService.getTestForCandidate(id),
    enabled: !!id,
  });
}

export function useDetailedReportCard(id: string) {
  return useQuery({
    queryKey: ["assessment", "report-card", id],
    queryFn: () => assessmentService.getDetailedReportCard(id),
    enabled: !!id,
  });
}

export function useAssignTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      pipelineId: string;
      templateId?: string;
      conductedById?: string;
      passPercentage?: number;
      durationMinutes?: number;
      scheduledAt?: string;
      questionIds?: string[];
    }) => assessmentService.assignTest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment", "tests"] });
      queryClient.invalidateQueries({ queryKey: ["assessment", "metrics"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
    },
  });
}

export function useStartTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assessmentService.startTest(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assessment", "tests", data.id] });
      queryClient.invalidateQueries({ queryKey: ["assessment", "candidate-test", data.id] });
    },
  });
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      testId,
      questionId,
      selectedOption,
    }: {
      testId: string;
      questionId: string;
      selectedOption: number;
    }) => assessmentService.submitAnswer(testId, questionId, selectedOption),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assessment", "candidate-test", variables.testId] });
    },
  });
}

export function useCompleteTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assessmentService.completeTest(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assessment", "tests", data.id] });
      queryClient.invalidateQueries({ queryKey: ["assessment", "candidate-test", data.id] });
      queryClient.invalidateQueries({ queryKey: ["assessment", "report-card", data.id] });
      queryClient.invalidateQueries({ queryKey: ["assessment", "metrics"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
    },
  });
}
