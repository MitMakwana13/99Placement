import { useQuery } from "@tanstack/react-query";
import { screeningService } from "@/services/screening";

export function useScreeningMetrics() {
  return useQuery({
    queryKey: ["screening-metrics"],
    queryFn: () => screeningService.getMetrics(),
    refetchInterval: 10000, // automatic refetch every 10 seconds for real-time dashboard feel
  });
}
