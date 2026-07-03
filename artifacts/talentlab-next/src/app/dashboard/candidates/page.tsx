"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCandidates } from "@/modules/candidate/hooks/useCandidates";
import { useCreateCandidate } from "@/modules/candidate/hooks/useCreateCandidate";
import { useDeleteCandidate } from "@/modules/candidate/hooks/useDeleteCandidate";
import { Candidate, CandidateFilters } from "@/modules/candidate/types";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CandidateForm } from "@/modules/candidate/components/CandidateForm";
import { useToast } from "@/providers/ToastProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Filter, Trash2, UserPlus, Sparkles, Building, Briefcase } from "lucide-react";

export default function CandidatesListPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Search & Filter state variables
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10; // set pagination limit for demonstration

  // React Query fetchers
  const filters: CandidateFilters = {
    search: search || undefined,
    source: source || undefined,
    limit,
    offset: (page - 1) * limit,
  };

  const { data: candidates = [], isLoading, error, refetch } = useCandidates(filters);
  const createMutation = useCreateCandidate();
  const deleteMutation = useDeleteCandidate();

  // Onboard modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Column definitions
  const columns: Column<Candidate>[] = [
    {
      key: "initials",
      label: "",
      render: (item) => (
        <div className="h-9 w-9 rounded-2xl bg-pastel-pink/35 text-pastel-pink-ink font-extrabold flex items-center justify-center text-xs shrink-0 select-none">
          {item.initials || item.name.substring(0, 2).toUpperCase()}
        </div>
      ),
    },
    {
      key: "name",
      label: "Full Name",
      sortable: true,
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{item.name}</span>
          <span className="text-[10px] text-muted-foreground">{item.email}</span>
        </div>
      ),
    },
    {
      key: "currentRole",
      label: "Current Role / CTC",
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-xs text-foreground font-semibold">{item.currentRole || "N/A"}</span>
          {item.currentCtc ? (
            <span className="text-[10px] text-muted-foreground">CTC: ${item.currentCtc.toLocaleString()}</span>
          ) : (
            <span className="text-[10px] text-muted-foreground">CTC: Not disclosed</span>
          )}
        </div>
      ),
    },
    {
      key: "experienceYears",
      label: "Exp",
      render: (item) => (
        <span className="text-xs font-semibold">
          {item.experienceYears !== null && item.experienceYears !== undefined
            ? `${item.experienceYears} yrs`
            : "N/A"}
        </span>
      ),
    },
    {
      key: "location",
      label: "Location",
      render: (item) => <span className="text-xs text-muted-foreground font-medium">{item.location || "Remote"}</span>,
    },
    {
      key: "source",
      label: "Sourcing Channel",
      render: (item) => {
        const getSourceBadge = (src: string | null) => {
          switch (src) {
            case "linkedin":
              return "bg-pastel-blue text-pastel-blue-ink border-blue-200/10";
            case "referral":
              return "bg-pastel-green text-pastel-green-ink border-green-200/10";
            case "career_page":
              return "bg-pastel-lavender text-ink border-purple-200/10";
            case "agency":
              return "bg-pastel-peach text-ink border-orange-200/10";
            case "portal":
            default:
              return "bg-pastel-yellow text-pastel-yellow-ink border-yellow-200/10";
          }
        };

        return (
          <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getSourceBadge(item.source)}`}>
            {(item.source || "portal").replace("_", " ")}
          </span>
        );
      },
    },
  ];

  const handleRowClick = (candidate: Candidate) => {
    router.push(`/dashboard/candidates/${candidate.id}`);
  };

  const handleOnboardSubmit = async (values: any) => {
    try {
      await createMutation.mutateAsync(values);
      toast("Candidate profile onboarded successfully!", "success");
      setIsModalOpen(false);
    } catch (err: any) {
      toast(err.message || "Failed to onboard candidate profile.", "error");
    }
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} candidate profile(s)?`)) return;

    let successCount = 0;
    for (const id of selectedIds) {
      try {
        await deleteMutation.mutateAsync(id);
        successCount++;
      } catch (err) {
        console.error(`Failed to delete profile with id: ${id}`, err);
      }
    }

    if (successCount > 0) {
      toast(`Successfully deleted ${successCount} profile(s)`, "success");
    } else {
      toast("Failed to delete any profiles", "error");
    }
  };

  const sourceFilterOptions = [
    { value: "", label: "All Sourcing Channels" },
    { value: "portal", label: "Internal Portal" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "referral", label: "Referrals" },
    { value: "career_page", label: "Careers Page" },
    { value: "agency", label: "Agencies" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Candidates CRM <span className="text-xs px-2.5 py-1 bg-pastel-pink/20 text-pastel-pink-ink font-bold rounded-full border border-pink-200/10">Active Slice</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage candidates, view resumes, and schedule screening operations.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 h-11 px-5 py-2.5 rounded-2xl cursor-pointer shadow active:scale-95 transition-all"
        >
          <UserPlus className="h-4.5 w-4.5 text-pastel-pink" />
          <span>Onboard Candidate</span>
        </Button>
      </header>

      {/* Main Table Panel */}
      <DataTable
        columns={columns}
        data={candidates}
        isLoading={isLoading}
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1); // Reset page to 1 on filter/search change
        }}
        searchPlaceholder="Filter by name, email, or role..."
        filterComponent={
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPage(1);
            }}
            className="flex h-11 w-44 rounded-2xl border border-input bg-card px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          >
            {sourceFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        }
        bulkActions={(selectedIds) => (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleBulkDelete(selectedIds)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Bulk Delete</span>
          </Button>
        )}
        pagination={
          candidates.length >= limit || page > 1
            ? {
                currentPage: page,
                totalPages: candidates.length < limit && page === 1 ? 1 : page + 1, // Simple incremental pagination mapping
                onPageChange: (nextPage) => setPage(nextPage),
              }
            : undefined
        }
        onRowClick={handleRowClick}
      />

      {/* Onboarding Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Onboard New Candidate Profile"
      >
        <CandidateForm
          onSubmit={handleOnboardSubmit}
          isLoading={createMutation.isPending}
        />
      </Dialog>
    </div>
  );
}
