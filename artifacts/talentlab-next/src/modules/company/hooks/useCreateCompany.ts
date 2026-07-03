import { useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService } from "@/services/company";
import { CreateCompanyInput } from "../types";

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCompanyInput) => companyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}
