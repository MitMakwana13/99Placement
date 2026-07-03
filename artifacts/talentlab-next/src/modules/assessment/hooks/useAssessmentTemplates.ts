import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assessmentService } from "@/services/assessment";
import { AssessmentTemplate } from "@/modules/assessment/types";

export function useAssessmentTemplates() {
  return useQuery({
    queryKey: ["assessment", "templates"],
    queryFn: () => assessmentService.listTemplates(),
  });
}

export function useAssessmentTemplate(id: string) {
  return useQuery({
    queryKey: ["assessment", "templates", id],
    queryFn: () => assessmentService.getTemplateById(id),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AssessmentTemplate, "id" | "tenantId" | "createdAt">) =>
      assessmentService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment", "templates"] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssessmentTemplate> }) =>
      assessmentService.updateTemplate(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["assessment", "templates"] });
      queryClient.invalidateQueries({ queryKey: ["assessment", "templates", variables.id] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assessmentService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessment", "templates"] });
    },
  });
}
