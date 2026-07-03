import { useMutation, useQueryClient } from "@tanstack/react-query";
import { screeningService } from "@/services/screening";
import { SubmitScorecardInput } from "../types";

interface SubmitScorecardArgs {
  id: string;
  data: SubmitScorecardInput;
}

export function useSubmitScorecard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: SubmitScorecardArgs) => screeningService.submitScorecard(id, data),
    onSuccess: (updatedScreening) => {
      queryClient.invalidateQueries({ queryKey: ["screening", updatedScreening.id] });
      queryClient.invalidateQueries({ queryKey: ["screenings"] });
      queryClient.invalidateQueries({ queryKey: ["screening-metrics"] });
      if (updatedScreening.pipelineId) {
        queryClient.invalidateQueries({ queryKey: ["screenings-by-pipeline", updatedScreening.pipelineId] });
        queryClient.invalidateQueries({ queryKey: ["pipeline"] }); // invalidate general pipelines cache
      }
    },
  });
}
