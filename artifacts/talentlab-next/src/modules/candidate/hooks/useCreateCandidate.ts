import { useMutation, useQueryClient } from "@tanstack/react-query";
import { candidateService } from "@/services/candidate";

export function useCreateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => candidateService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
}
