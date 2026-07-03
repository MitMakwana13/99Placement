import { useQuery } from "@tanstack/react-query";
import { companyService } from "@/services/company";
import { CompanyFilters } from "../types";

export function useCompanies(filters: CompanyFilters = {}) {
  return useQuery({
    queryKey: ["companies", filters],
    queryFn: () => companyService.list(filters),
    placeholderData: (prev) => prev,
  });
}
