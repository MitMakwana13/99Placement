import { useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService } from "@/services/company";

export function useAssignRecruiter(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, isLead }: { userId: string; isLead?: boolean }) =>
      companyService.assignRecruiter(companyId, userId, isLead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
    },
  });
}

export function useRemoveRecruiter(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      companyService.removeRecruiter(companyId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
    },
  });
}
