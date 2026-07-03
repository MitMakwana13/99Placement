import { useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService } from "@/services/company";
import { UpdateCompanyInput } from "../types";

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyInput }) =>
      companyService.update(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["company", id] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}
