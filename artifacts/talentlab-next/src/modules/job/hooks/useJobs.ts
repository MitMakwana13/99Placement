import { useQuery } from "@tanstack/react-query";
import { jobService } from "@/services/job";
import { JobFilters } from "../types";

export function useJobs(filters: JobFilters = {}) {
  return useQuery({
    queryKey: ["jobs", filters],
    queryFn: () => jobService.list(filters),
    placeholderData: (previousData) => previousData,
  });
}
