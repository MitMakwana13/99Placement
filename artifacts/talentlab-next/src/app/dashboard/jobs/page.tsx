"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useJobs } from "@/modules/job/hooks/useJobs";
import { useCreateJob } from "@/modules/job/hooks/useCreateJob";
import { useDeleteJob } from "@/modules/job/hooks/useDeleteJob";
import { Job, JobFilters } from "@/modules/job/types";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { JobForm } from "@/modules/job/components/JobForm";
import { useToast } from "@/providers/ToastProvider";
import { Briefcase, Search, Filter, Trash2, Plus, ArrowRight, Sparkles } from "lucide-react";

export default function JobsListPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const filters: JobFilters = {
    search: search || undefined,
    status: (statusFilter as Job["status"]) || undefined,
    limit,
    offset: (page - 1) * limit,
  };

  const { data: jobs = [], isLoading, error } = useJobs(filters);
  const createMutation = useCreateJob();
  const deleteMutation = useDeleteJob();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns: Column<Job>[] = [
    {
      key: "code",
      label: "Code",
      render: (item) => (
        <span className="font-bold text-[11px] text-muted-foreground uppercase bg-muted/50 px-2 py-0.5 rounded-lg border border-border/20">
          {item.code || "N/A"}
        </span>
      ),
    },
    {
      key: "title",
      label: "Job Title",
      sortable: true,
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{item.title}</span>
          <span className="text-[10px] text-muted-foreground">{item.company?.name || "99 Placement Internal"}</span>
        </div>
      ),
    },
    {
      key: "location",
      label: "Location",
      render: (item) => <span className="text-xs text-muted-foreground font-medium">{item.location}</span>,
    },
    {
      key: "jobType",
      label: "Job Type",
      render: (item) => (
        <span className="text-xs font-semibold capitalize text-foreground">
          {item.jobType.replace("_", " ")}
        </span>
      ),
    },
    {
      key: "urgency",
      label: "Urgency",
      render: (item) => {
        const getUrgencyBadge = (u: Job["urgency"]) => {
          switch (u) {
            case "CRITICAL":
              return "bg-pastel-pink text-pastel-pink-ink border-pink-200/10";
            case "HIGH":
              return "bg-pastel-yellow text-pastel-yellow-ink border-yellow-200/10";
            case "NORMAL":
            default:
              return "bg-pastel-blue text-pastel-blue-ink border-blue-200/10";
          }
        };

        return (
          <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getUrgencyBadge(item.urgency)}`}>
            {item.urgency}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Workflow Status",
      render: (item) => {
        const getStatusBadge = (s: Job["status"]) => {
          switch (s) {
            case "OPEN":
            case "APPROVED":
              return "bg-pastel-green text-pastel-green-ink border-green-200/10";
            case "DRAFT":
              return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200/10";
            case "PENDING_APPROVAL":
              return "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/10";
            case "CLOSED":
            case "ARCHIVED":
            case "CANCELLED":
              return "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200/10";
            case "ON_HOLD":
            default:
              return "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-200/10";
          }
        };

        return (
          <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getStatusBadge(item.status)}`}>
            {item.status.replace("_", " ")}
          </span>
        );
      },
    },
    {
      key: "openingsCount",
      label: "Openings",
      render: (item) => (
        <span className="text-xs font-semibold">{item.openingsCount || 1}</span>
      ),
    },
  ];

  const handleRowClick = (job: Job) => {
    router.push(`/dashboard/jobs/${job.id}`);
  };

  const handleCreateSubmit = async (values: any) => {
    try {
      await createMutation.mutateAsync(values);
      toast("Job posting published successfully!", "success");
      setIsModalOpen(false);
    } catch (err: any) {
      toast(err.message || "Failed to publish job posting.", "error");
    }
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} job posting(s)?`)) return;

    let successCount = 0;
    for (const id of selectedIds) {
      try {
        await deleteMutation.mutateAsync(id);
        successCount++;
      } catch (err) {
        console.error(`Failed to delete job with id: ${id}`, err);
      }
    }

    if (successCount > 0) {
      toast(`Successfully deleted ${successCount} job(s)`, "success");
    } else {
      toast("Failed to delete any job postings", "error");
    }
  };

  const statusFilterOptions = [
    { value: "", label: "All Statuses" },
    { value: "DRAFT", label: "Draft" },
    { value: "PENDING_APPROVAL", label: "Pending Approval" },
    { value: "OPEN", label: "Open" },
    { value: "ON_HOLD", label: "On Hold" },
    { value: "CLOSED", label: "Closed" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Job Board CRM <span className="text-xs px-2.5 py-1 bg-pastel-pink/20 text-pastel-pink-ink font-bold rounded-full border border-pink-200/10">Active Slice</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create, track, and manage job openings, requirements, and candidate assignments.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 h-11 px-5 py-2.5 rounded-2xl cursor-pointer shadow active:scale-95 transition-all"
        >
          <Plus className="h-4.5 w-4.5 text-pastel-pink" />
          <span>Publish Job</span>
        </Button>
      </header>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={jobs}
        isLoading={isLoading}
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Filter by title, code or location..."
        filterComponent={
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="flex h-11 w-44 rounded-2xl border border-input bg-card px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          >
            {statusFilterOptions.map((opt) => (
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
          jobs.length >= limit || page > 1
            ? {
                currentPage: page,
                totalPages: jobs.length < limit && page === 1 ? 1 : page + 1,
                onPageChange: (nextPage) => setPage(nextPage),
              }
            : undefined
        }
        onRowClick={handleRowClick}
      />

      {/* Dialog creation modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Publish New Job Opening"
      >
        <JobForm
          onSubmit={handleCreateSubmit}
          isLoading={createMutation.isPending}
        />
      </Dialog>
    </div>
  );
}
