import { useQuery } from "@tanstack/react-query";
import { pipelineService } from "@/services/pipeline";
import { PipelineFilters } from "../types";

export function usePipelines(filters: PipelineFilters = {}) {
  // Pass backend filters
  const apiFilters = {
    search: filters.search,
    jobId: filters.jobId,
    assignedRecruiterId: filters.assignedRecruiterId,
  };

  return useQuery({
    queryKey: ["pipelines", apiFilters],
    queryFn: () => pipelineService.list(apiFilters),
    placeholderData: (previousData) => previousData, // keep UX responsive when filters change
  });
}
