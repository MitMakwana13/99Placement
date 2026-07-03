import { useMutation, useQueryClient } from "@tanstack/react-query";
import { candidateService } from "@/services/candidate";

export function useUpdateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      candidateService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      queryClient.invalidateQueries({ queryKey: ["candidate", variables.id] });
    },
  });
}
