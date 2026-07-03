import { useMutation, useQueryClient } from "@tanstack/react-query";
import { screeningService } from "@/services/screening";
import { RescheduleScreeningInput } from "../types";

interface RescheduleArgs {
  id: string;
  data: RescheduleScreeningInput;
}

export function useRescheduleScreening() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: RescheduleArgs) => screeningService.reschedule(id, data),
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
