import { useQuery } from "@tanstack/react-query";
import { assessmentService } from "@/services/assessment";

export function useAssessmentMetrics() {
  return useQuery({
    queryKey: ["assessment", "metrics"],
    queryFn: () => assessmentService.getMetrics(),
  });
}
