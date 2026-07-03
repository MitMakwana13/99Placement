import { useMutation, useQueryClient } from "@tanstack/react-query";
import { screeningService } from "@/services/screening";

export function useRestoreScreening() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => screeningService.restore(id),
    onSuccess: (updatedScreening) => {
      queryClient.invalidateQueries({ queryKey: ["screening", updatedScreening.id] });
      queryClient.invalidateQueries({ queryKey: ["screenings"] });
      queryClient.invalidateQueries({ queryKey: ["screening-metrics"] });
      if (updatedScreening.pipelineId) {
        queryClient.invalidateQueries({ queryKey: ["screenings-by-pipeline", updatedScreening.pipelineId] });
      }
    },
  });
}
