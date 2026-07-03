"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useScreenings } from "@/modules/screening/hooks/useScreenings";
import { useScreeningMetrics } from "@/modules/screening/hooks/useScreeningMetrics";
import { useCancelScreening } from "@/modules/screening/hooks/useCancelScreening";
import { Screening, ScreeningVerdict, ScreeningFilters } from "@/modules/screening/types";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ScreeningScheduleModal } from "@/modules/screening/components/ScreeningScheduleModal";
import { useToast } from "@/providers/ToastProvider";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Award,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Eye,
  Trash2,
  HelpCircle,
} from "lucide-react";

export default function ScreeningListPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Query filters
  const filters: ScreeningFilters = {
    verdict: (verdictFilter as ScreeningVerdict) || undefined,
    page,
    pageSize: limit,
  };

  const { data: screeningsResult, isLoading, refetch } = useScreenings(filters);
  const { data: metrics, isLoading: isLoadingMetrics } = useScreeningMetrics();
  const cancelMutation = useCancelScreening();

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const items = screeningsResult?.items || [];
  const totalItems = screeningsResult?.total || 0;
  const totalPages = screeningsResult?.totalPages || 1;

  // Client-side candidate/interviewer search filter
  const filteredItems = items.filter((scr) => {
    const candidateName = scr.pipeline?.candidate?.name || "";
    const interviewerName = scr.interviewer?.name || "";
    const jobTitle = scr.pipeline?.job?.title || "";
    const query = search.toLowerCase();
    return (
      candidateName.toLowerCase().includes(query) ||
      interviewerName.toLowerCase().includes(query) ||
      jobTitle.toLowerCase().includes(query)
    );
  });

  const columns: Column<Screening>[] = [
    {
      key: "candidate",
      label: "Candidate & Job",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground hover:underline cursor-pointer" onClick={(e) => {
            e.stopPropagation();
            if (item.pipeline?.candidate?.id) {
              router.push(`/dashboard/candidates/${item.pipeline.candidate.id}`);
            }
          }}>
            {item.pipeline?.candidate?.name || "Unknown Candidate"}
          </span>
          <span className="text-[10px] text-muted-foreground hover:underline cursor-pointer" onClick={(e) => {
            e.stopPropagation();
            if (item.pipeline?.job?.id) {
              router.push(`/dashboard/jobs/${item.pipeline.job.id}`);
            }
          }}>
            {item.pipeline?.job?.title || "No Job Associated"}
          </span>
        </div>
      ),
    },
    {
      key: "interviewer",
      label: "Interviewer",
      render: (item) => (
        <span className="text-xs text-foreground font-semibold">
          {item.interviewer?.name || "Assigned Recruiter"}
        </span>
      ),
    },
    {
      key: "scheduledAt",
      label: "Schedule Time",
      sortable: true,
      render: (item) => {
        const d = new Date(item.scheduledAt);
        return (
          <div className="flex flex-col">
            <span className="text-xs text-foreground font-medium">
              {d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        );
      },
    },
    {
      key: "mode",
      label: "Mode",
      render: (item) => {
        const modeLabels: Record<string, string> = {
          phone: "Phone",
          video: "Video Call",
          in_person: "In Person",
        };
        return (
          <span className="text-xs font-semibold capitalize text-foreground/90">
            {modeLabels[item.mode] || item.mode}
          </span>
        );
      },
    },
    {
      key: "overallScore",
      label: "Average Score",
      render: (item) => {
        if (item.overallScore === null || item.overallScore === undefined) {
          return <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg border">Pending</span>;
        }
        return (
          <span className="text-xs font-black text-foreground">
            {item.overallScore} / 10
          </span>
        );
      },
    },
    {
      key: "verdict",
      label: "Status / Verdict",
      render: (item) => {
        if (item.deletedAt) {
          return (
            <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full border bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200/10 uppercase">
              Cancelled
            </span>
          );
        }
        if (item.verdict === null || item.verdict === undefined) {
          const isPassed = new Date(item.scheduledAt) < new Date();
          return (
            <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${
              isPassed ? "bg-pastel-yellow text-pastel-yellow-ink border-yellow-200/10" : "bg-pastel-blue text-pastel-blue-ink border-blue-200/10"
            }`}>
              {isPassed ? "Needs Scorecard" : "Scheduled"}
            </span>
          );
        }

        const getVerdictStyles = (v: ScreeningVerdict) => {
          switch (v) {
            case "SHORTLIST":
              return "bg-pastel-green text-pastel-green-ink border-green-200/10";
            case "HOLD":
              return "bg-pastel-yellow text-pastel-yellow-ink border-yellow-200/10";
            case "REJECT":
              return "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200/10";
          }
        };

        return (
          <span className={`inline-block text-[9px] font-extrabold px-2.5 py-1 rounded-full border uppercase ${getVerdictStyles(item.verdict)}`}>
            {item.verdict}
          </span>
        );
      },
    },
  ];

  const handleRowClick = (scr: Screening) => {
    router.push(`/dashboard/screening/${scr.id}`);
  };

  const handleCancelScreening = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled screening?")) return;
    try {
      await cancelMutation.mutateAsync({ id, reason: "Cancelled by coordinator" });
      toast("Screening session cancelled successfully", "success");
      refetch();
    } catch (err: any) {
      toast(err.message || "Failed to cancel screening.", "error");
    }
  };

  const stats = [
    {
      label: "Pending Screenings",
      value: metrics?.pending ?? 0,
      icon: Clock,
      color: "text-pastel-blue-ink bg-pastel-blue-ink/10 border-pastel-blue-ink/20",
    },
    {
      label: "Conducted Reviews",
      value: metrics?.conducted ?? 0,
      icon: CheckCircle,
      color: "text-green-500 bg-green-500/10 border-green-500/20",
    },
    {
      label: "Average Score",
      value: metrics?.averageScore ? `${Math.round(metrics.averageScore * 10) / 10} / 10` : "N/A",
      icon: Award,
      color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    },
    {
      label: "Shortlist (Pass Rate)",
      value: metrics?.shortlistRate ? `${metrics.shortlistRate}%` : "N/A",
      icon: RefreshCw,
      color: "text-pastel-pink bg-pastel-pink/10 border-pastel-pink/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Internal Screening Workspace <span className="text-xs px-2.5 py-1 bg-primary/15 text-primary font-bold rounded-full border border-primary/20">Stage 2</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Schedule initial reviews, fill scorecard evaluations, track notice periods, and submit shortlist/reject decisions.
          </p>
        </div>

        <Button
          onClick={() => setIsScheduleOpen(true)}
          className="flex items-center gap-2 h-11 px-5 py-2.5 rounded-2xl cursor-pointer shadow active:scale-95 transition-all"
        >
          <Plus className="h-4.5 w-4.5 text-pastel-pink" />
          <span>Schedule Screening</span>
        </Button>
      </header>

      {/* Analytics widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="p-4 rounded-2xl border bg-card/45 backdrop-blur-md shadow-sm flex items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {stat.label}
                </span>
                <span className="text-xl font-black text-foreground">{isLoadingMetrics ? "..." : stat.value}</span>
              </div>
              <div className={`p-2.5 rounded-xl border shrink-0 ${stat.color}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredItems}
        isLoading={isLoading}
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Filter candidate, interviewer or job..."
        filterComponent={
          <select
            value={verdictFilter}
            onChange={(e) => {
              setVerdictFilter(e.target.value);
              setPage(1);
            }}
            className="flex h-11 w-44 rounded-2xl border border-input bg-card px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="SHORTLIST">Shortlisted</option>
            <option value="HOLD">Held</option>
            <option value="REJECT">Rejected</option>
          </select>
        }
        bulkActions={(selectedIds) => (
          <div className="flex gap-2">
            {selectedIds.length === 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const item = filteredItems.find((x) => x.id === selectedIds[0]);
                  if (item && !item.verdict && !item.deletedAt) {
                    handleCancelScreening(item.id);
                  } else {
                    toast("Only active pending screenings can be cancelled.", "warning");
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-red-50 text-red-600 hover:bg-red-100 border-red-200/50"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Cancel Interview</span>
              </Button>
            )}
          </div>
        )}
        pagination={
          totalPages > 1
            ? {
                currentPage: page,
                totalPages: totalPages,
                onPageChange: (nextPage) => setPage(nextPage),
              }
            : undefined
        }
        onRowClick={handleRowClick}
      />

      {/* Schedule Dialog */}
      <Dialog
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule Screening Interview"
      >
        <ScreeningScheduleModal
          onSuccess={() => {
            setIsScheduleOpen(false);
            refetch();
          }}
          onCancel={() => setIsScheduleOpen(false)}
        />
      </Dialog>
    </div>
  );
}
