import { useQuery } from "@tanstack/react-query";
import { screeningService } from "@/services/screening";

export function useScreeningsByPipeline(pipelineId: string) {
  return useQuery({
    queryKey: ["screenings-by-pipeline", pipelineId],
    queryFn: () => screeningService.findByPipeline(pipelineId),
    enabled: !!pipelineId,
  });
}
