import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jobService } from "@/services/job";
import { Job } from "../types";

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobService.delete(id),
    
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["jobs"] });
      const previousJobs = queryClient.getQueryData<Job[]>(["jobs"]);

      if (previousJobs) {
        queryClient.setQueryData<Job[]>(
          ["jobs"],
          previousJobs.filter((j) => j.id !== deletedId)
        );
      }

      return { previousJobs };
    },

    onError: (err, deletedId, context) => {
      if (context?.previousJobs) {
        queryClient.setQueryData(["jobs"], context.previousJobs);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useArchiveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobService.archive(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job", variables] });
    },
  });
}
