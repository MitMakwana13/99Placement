import { useQuery } from "@tanstack/react-query";
import { jobService } from "@/services/job";

export function useJob(id: string) {
  return useQuery({
    queryKey: ["job", id],
    queryFn: () => jobService.findById(id),
    enabled: !!id,
  });
}
