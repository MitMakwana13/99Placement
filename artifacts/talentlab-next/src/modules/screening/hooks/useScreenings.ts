import { useQuery } from "@tanstack/react-query";
import { screeningService } from "@/services/screening";
import { ScreeningFilters } from "../types";

export function useScreenings(filters: ScreeningFilters = {}) {
  return useQuery({
    queryKey: ["screenings", filters],
    queryFn: () => screeningService.list(filters),
    placeholderData: (prev) => prev,
  });
}
