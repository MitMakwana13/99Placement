import { useMutation, useQueryClient } from "@tanstack/react-query";
import { screeningService } from "@/services/screening";

interface CancelArgs {
  id: string;
  reason?: string;
}

export function useCancelScreening() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: CancelArgs) => screeningService.cancel(id, reason),
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
