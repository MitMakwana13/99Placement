import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jobService } from "@/services/job";

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => jobService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
