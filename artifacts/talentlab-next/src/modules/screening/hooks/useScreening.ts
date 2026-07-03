import { useQuery } from "@tanstack/react-query";
import { screeningService } from "@/services/screening";

export function useScreening(id: string) {
  return useQuery({
    queryKey: ["screening", id],
    queryFn: () => screeningService.findById(id),
    enabled: !!id,
  });
}
