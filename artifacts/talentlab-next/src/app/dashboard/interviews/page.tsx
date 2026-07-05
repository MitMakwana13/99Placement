"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { interviewService } from "@/services/interview";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/providers/ToastProvider";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Video,
  FileText,
  User,
  MoreVertical,
  XCircle,
  HelpCircle,
} from "lucide-react";

export default function InterviewsListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: interviews = [], isLoading, refetch } = useQuery({
    queryKey: ["interviews"],
    queryFn: interviewService.list,
  });

  // Client-side search and filters
  const filteredInterviews = interviews.filter((item) => {
    const candidateName = item.pipeline?.candidate?.name || "";
    const interviewerName = item.interviewerName || "";
    const jobTitle = item.pipeline?.job?.title || "";
    const query = search.toLowerCase();
    
    const matchesSearch = 
      candidateName.toLowerCase().includes(query) ||
      interviewerName.toLowerCase().includes(query) ||
      jobTitle.toLowerCase().includes(query);

    const matchesStatus = statusFilter ? item.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  const columns: Column<any>[] = [
    {
      key: "candidate",
      label: "Candidate & Job",
      render: (item) => (
        <div className="flex flex-col">
          <span
            className="font-bold text-foreground hover:underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (item.pipeline?.candidate?.id) {
                router.push(`/dashboard/candidates/${item.pipeline.candidate.id}`);
              }
            }}
          >
            {item.pipeline?.candidate?.name || "Unknown Candidate"}
          </span>
          <span
            className="text-[10px] text-muted-foreground hover:underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (item.pipeline?.job?.id) {
                router.push(`/dashboard/jobs/${item.pipeline.job.id}`);
              }
            }}
          >
            {item.pipeline?.job?.title || "No Job Associated"}
          </span>
        </div>
      ),
    },
    {
      key: "interviewer",
      label: "Interviewer / Mode",
      render: (item) => (
        <div className="flex flex-col">
          <span className="text-xs text-foreground font-semibold">
            {item.interviewerName || "Not assigned"}
          </span>
          <span className="text-[10px] text-muted-foreground capitalize">
            {item.mode?.replace("_", " ") || "Phone"}
          </span>
        </div>
      ),
    },
    {
      key: "scheduledAt",
      label: "Scheduled Time",
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
      key: "type",
      label: "Type",
      render: (item) => (
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-muted border border-border/30">
          {item.type || "HR"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item) => {
        const status = item.status || "SCHEDULED";
        const getStyles = (s: string) => {
          switch (s) {
            case "COMPLETED":
              return "bg-pastel-green text-pastel-green-ink border-green-200/10";
            case "CANCELLED":
              return "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200/10";
            case "SCHEDULED":
            default:
              return "bg-pastel-blue text-pastel-blue-ink border-blue-200/10";
          }
        };

        return (
          <span className={`inline-block text-[9px] font-extrabold px-2.5 py-1 rounded-full border uppercase ${getStyles(status)}`}>
            {status}
          </span>
        );
      },
    },
  ];

  // Quick stats
  const scheduledCount = interviews.filter((x: any) => x.status === "SCHEDULED").length;
  const completedCount = interviews.filter((x: any) => x.status === "COMPLETED").length;
  const totalCount = interviews.length;

  const stats = [
    {
      label: "Total Interviews",
      value: totalCount,
      icon: Calendar,
      color: "text-pastel-pink bg-pastel-pink/10 border-pastel-pink/20",
    },
    {
      label: "Scheduled",
      value: scheduledCount,
      icon: Clock,
      color: "text-pastel-blue-ink bg-pastel-blue-ink/10 border-pastel-blue-ink/20",
    },
    {
      label: "Completed Reviews",
      value: completedCount,
      icon: CheckCircle2,
      color: "text-green-500 bg-green-500/10 border-green-500/20",
    },
    {
      label: "Completion Rate",
      value: totalCount ? `${Math.round((completedCount / totalCount) * 100)}%` : "0%",
      icon: Video,
      color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Client Interviews Workspace <span className="text-xs px-2.5 py-1 bg-primary/15 text-primary font-bold rounded-full border border-primary/20">Stage 4</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Coordinate interview schedules between candidates and client hiring managers.
          </p>
        </div>
      </header>

      {/* Stats Widgets */}
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
                <span className="text-xl font-black text-foreground">{isLoading ? "..." : stat.value}</span>
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
        data={filteredInterviews}
        isLoading={isLoading}
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
        }}
        searchPlaceholder="Search candidate, job or interviewer..."
        filterComponent={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-11 w-44 rounded-2xl border border-input bg-card px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        }
      />
    </div>
  );
}
