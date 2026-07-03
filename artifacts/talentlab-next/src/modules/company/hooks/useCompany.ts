import { useQuery } from "@tanstack/react-query";
import { companyService } from "@/services/company";

export function useCompany(id: string) {
  return useQuery({
    queryKey: ["company", id],
    queryFn: () => companyService.findById(id),
    enabled: !!id,
  });
}
