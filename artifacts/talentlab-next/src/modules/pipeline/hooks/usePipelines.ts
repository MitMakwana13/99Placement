import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { pipelineService } from "@/services/pipeline";
import { PipelineFilters } from "../types";
import { useSocket } from "@/providers/SocketProvider";

export function usePipelines(filters: PipelineFilters = {}) {
  // Pass backend filters
  const apiFilters = {
    search: filters.search,
    jobId: filters.jobId,
    assignedRecruiterId: filters.assignedRecruiterId,
  };

  const queryClient = useQueryClient();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handlePipelineUpdate = (data: any) => {
      // Invalidate the pipeline cache in the background to fetch fresh data
      // This works beautifully alongside optimistic updates from the local user
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    };

    socket.on("pipeline:updated", handlePipelineUpdate);

    return () => {
      socket.off("pipeline:updated", handlePipelineUpdate);
    };
  }, [socket, queryClient]);

  return useQuery({
    queryKey: ["pipelines", apiFilters],
    queryFn: () => pipelineService.list(apiFilters),
    placeholderData: (previousData) => previousData, // keep UX responsive when filters change
  });
}
