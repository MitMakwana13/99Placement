import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService } from "@/services/company";
import { AddNoteInput } from "../types";

export function useCompanyNotes(companyId: string) {
  return useQuery({
    queryKey: ["company-notes", companyId],
    queryFn: () => companyService.getNotes(companyId),
    enabled: !!companyId,
  });
}

export function useCreateNote(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddNoteInput) => companyService.addNote(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-notes", companyId] });
    },
  });
}
