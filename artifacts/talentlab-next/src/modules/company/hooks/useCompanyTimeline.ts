import { useQuery } from "@tanstack/react-query";
import { companyService } from "@/services/company";

export function useCompanyTimeline(companyId: string) {
  return useQuery({
    queryKey: ["company-timeline", companyId],
    queryFn: () => companyService.getTimeline(companyId),
    enabled: !!companyId,
  });
}
