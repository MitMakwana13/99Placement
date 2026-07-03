import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService } from "@/services/company";

export function useCompanyDepartments(companyId: string) {
  return useQuery({
    queryKey: ["company-departments", companyId],
    queryFn: () => companyService.getDepartments(companyId),
    enabled: !!companyId,
  });
}

export function useAddDepartment(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; headName?: string; headEmail?: string; description?: string }) =>
      companyService.addDepartment(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-departments", companyId] });
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
    },
  });
}
