import { useQuery } from "@tanstack/react-query";
import { candidateService } from "@/services/candidate";

export function useCandidate(id: string) {
  return useQuery({
    queryKey: ["candidate", id],
    queryFn: () => candidateService.findById(id),
    enabled: !!id,
  });
}
