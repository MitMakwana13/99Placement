import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService } from "@/services/company";
import { CreateContactInput } from "../types";

export function useCompanyContacts(companyId: string) {
  return useQuery({
    queryKey: ["company-contacts", companyId],
    queryFn: () => companyService.getContacts(companyId),
    enabled: !!companyId,
  });
}

export function useCreateContact(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContactInput) =>
      companyService.addContact(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-contacts", companyId] });
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
    },
  });
}

export function useUpdateContact(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contactId,
      data,
    }: {
      contactId: string;
      data: Partial<CreateContactInput>;
    }) => companyService.updateContact(companyId, contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-contacts", companyId] });
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
    },
  });
}

export function useDeleteContact(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) =>
      companyService.deleteContact(companyId, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-contacts", companyId] });
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
    },
  });
}
