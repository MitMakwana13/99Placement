import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pipelineService } from "@/services/pipeline";
import { useToast } from "@/providers/ToastProvider";

export function useUpdatePipelineStage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      pipelineService.updateStage(id, stage),

    onMutate: async ({ id, stage }) => {
      // Cancel outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ["pipelines"] });

      // Snapshot all existing query cache states to support clean rollbacks
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll({ queryKey: ["pipelines"] });
      const snapshots = queries.map((query) => ({
        queryKey: query.queryKey,
        data: query.state.data,
      }));

      // Optimistically update all matching cache entries instantly
      queries.forEach((query) => {
        const queryKey = query.queryKey;
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old || !old.items) return old;

          return {
            ...old,
            items: old.items.map((item: any) => {
              if (item.id === id) {
                return {
                  ...item,
                  stage,
                  stageUpdatedAt: new Date().toISOString(),
                };
              }
              return item;
            }),
          };
        });
      });

      return { snapshots };
    },

    onError: (err: any, variables, context) => {
      // Rollback caches to pre-mutated snapshots
      if (context?.snapshots) {
        context.snapshots.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast(err.message || "Failed to move candidate. Checklist constraints may not be met.", "error");
    },

    onSettled: () => {
      // Sync back with backend state
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    },
  });
}
