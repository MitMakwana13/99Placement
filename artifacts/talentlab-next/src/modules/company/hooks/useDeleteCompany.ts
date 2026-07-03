import { useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService } from "@/services/company";

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export function useArchiveCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companyService.archive(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["company", id] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export function useRestoreCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companyService.restore(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["company", id] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}
