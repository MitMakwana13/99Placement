import { useMutation, useQueryClient } from "@tanstack/react-query";
import { screeningService } from "@/services/screening";
import { ScheduleScreeningInput } from "../types";

export function useScheduleScreening() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScheduleScreeningInput) => screeningService.schedule(data),
    onSuccess: (newScreening) => {
      // Invalidate screening list and metrics
      queryClient.invalidateQueries({ queryKey: ["screenings"] });
      queryClient.invalidateQueries({ queryKey: ["screening-metrics"] });
      if (newScreening.pipelineId) {
        queryClient.invalidateQueries({ queryKey: ["screenings-by-pipeline", newScreening.pipelineId] });
      }
    },
  });
}
