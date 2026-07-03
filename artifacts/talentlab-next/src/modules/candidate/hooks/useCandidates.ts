import { useQuery } from "@tanstack/react-query";
import { candidateService } from "@/services/candidate";
import { CandidateFilters } from "../types";

export function useCandidates(filters: CandidateFilters = {}) {
  return useQuery({
    queryKey: ["candidates", filters],
    queryFn: () => candidateService.list(filters),
    placeholderData: (previousData) => previousData, // smooth transitions during search/filter
  });
}
