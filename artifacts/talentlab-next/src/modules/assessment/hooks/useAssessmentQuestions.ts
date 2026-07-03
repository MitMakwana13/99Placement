import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assessmentService } from "@/services/assessment";

export function useAssessmentQuestions(params?: {
  category?: string;
  difficulty?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["assessment", "questions", params],
    queryFn: () => assessmentService.listQuestions(params),
  });
}

export function useWeakQuestions() {
  return useQuery({
    queryKey: ["assessment", "questions", "weak"],
    queryFn: () => assessmentService.getWeakQuestions(),
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      category: string;
      questionText: string;
      options: string[];
      correctOption: number;
      difficulty?: string;
    }) => assessmentService.createQuestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment", "questions"] });
    },
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        category?: string;
        questionText?: string;
        options?: string[];
        correctOption?: number;
        difficulty?: string;
        isActive?: boolean;
      };
    }) => assessmentService.updateQuestion(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assessment", "questions"] });
      queryClient.invalidateQueries({ queryKey: ["assessment", "questions", variables.id] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assessmentService.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment", "questions"] });
    },
  });
}
