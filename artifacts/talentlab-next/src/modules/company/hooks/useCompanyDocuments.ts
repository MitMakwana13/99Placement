import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService } from "@/services/company";
import { AddDocumentInput } from "../types";

export function useCompanyDocuments(companyId: string) {
  return useQuery({
    queryKey: ["company-documents", companyId],
    queryFn: () => companyService.getDocuments(companyId),
    enabled: !!companyId,
  });
}

export function useAddDocument(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddDocumentInput) =>
      companyService.addDocument(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-documents", companyId] });
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
    },
  });
}
