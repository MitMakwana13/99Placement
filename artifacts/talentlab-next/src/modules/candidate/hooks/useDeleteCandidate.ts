import { useMutation, useQueryClient } from "@tanstack/react-query";
import { candidateService } from "@/services/candidate";
import { Candidate } from "../types";

export function useDeleteCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => candidateService.delete(id),
    
    // Perform optimistic updates
    onMutate: async (deletedId) => {
      // Cancel outgoing queries to avoid overwriting our optimistic state
      await queryClient.cancelQueries({ queryKey: ["candidates"] });

      // Snapshot the previous cache value
      const previousCandidates = queryClient.getQueryData<Candidate[]>(["candidates"]);

      // Optimistically update the list
      if (previousCandidates) {
        queryClient.setQueryData<Candidate[]>(
          ["candidates"],
          previousCandidates.filter((c) => c.id !== deletedId)
        );
      }

      // Return a context object with the snapshot value
      return { previousCandidates };
    },

    // If mutation fails, rollback the cache update
    onError: (err, deletedId, context) => {
      if (context?.previousCandidates) {
        queryClient.setQueryData(["candidates"], context.previousCandidates);
      }
    },

    // Always refetch / invalidate after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
}
