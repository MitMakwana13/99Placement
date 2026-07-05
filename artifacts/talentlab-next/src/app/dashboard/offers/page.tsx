"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offerService } from "@/services/offer";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/providers/ToastProvider";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Briefcase,
  User,
} from "lucide-react";

export default function OffersListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: offers = [], isLoading, refetch } = useQuery({
    queryKey: ["offers"],
    queryFn: offerService.list,
  });

  // Client-side search and filters
  const filteredOffers = offers.filter((item) => {
    const candidateName = item.pipeline?.candidate?.name || "";
    const jobTitle = item.pipeline?.job?.title || "";
    const companyName = item.pipeline?.job?.company?.name || "";
    const query = search.toLowerCase();
    
    const matchesSearch = 
      candidateName.toLowerCase().includes(query) ||
      jobTitle.toLowerCase().includes(query) ||
      companyName.toLowerCase().includes(query);

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
      key: "ctc",
      label: "Offered CTC (Annual)",
      render: (item) => {
        const ctc = item.offeredCtc;
        if (!ctc) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <span className="text-xs text-foreground font-semibold">
            ₹{Number(ctc).toLocaleString("en-IN")}
          </span>
        );
      },
    },
    {
      key: "sentAt",
      label: "Release Date",
      render: (item) => {
        const d = item.sentAt ? new Date(item.sentAt) : null;
        if (!d) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <span className="text-xs text-foreground">
            {d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </span>
        );
      },
    },
    {
      key: "joiningDate",
      label: "Target Joining Date",
      render: (item) => {
        const d = item.joiningDate ? new Date(item.joiningDate) : null;
        if (!d) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <span className="text-xs text-foreground font-medium text-pastel-blue-ink">
            {d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (item) => {
        const status = item.status || "SENT";
        const getStyles = (s: string) => {
          switch (s) {
            case "ACCEPTED":
              return "bg-pastel-green text-pastel-green-ink border-green-200/10";
            case "REJECTED":
              return "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200/10";
            case "SENT":
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
  const totalCount = offers.length;
  const acceptedCount = offers.filter((x: any) => x.status === "ACCEPTED").length;
  const pendingCount = offers.filter((x: any) => x.status === "SENT").length;

  const stats = [
    {
      label: "Total Offers Released",
      value: totalCount,
      icon: FileText,
      color: "text-pastel-pink bg-pastel-pink/10 border-pastel-pink/20",
    },
    {
      label: "Pending Response",
      value: pendingCount,
      icon: Clock,
      color: "text-pastel-blue-ink bg-pastel-blue-ink/10 border-pastel-blue-ink/20",
    },
    {
      label: "Offers Accepted",
      value: acceptedCount,
      icon: CheckCircle2,
      color: "text-green-500 bg-green-500/10 border-green-500/20",
    },
    {
      label: "Acceptance Rate",
      value: totalCount ? `${Math.round((acceptedCount / totalCount) * 100)}%` : "0%",
      icon: TrendingUp,
      color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Offer Management Workspace <span className="text-xs px-2.5 py-1 bg-primary/15 text-primary font-bold rounded-full border border-primary/20">Stage 5</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track offer letters generated, candidate negotiations, targets joining dates, and acceptance ratios.
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
        data={filteredOffers}
        isLoading={isLoading}
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
        }}
        searchPlaceholder="Search candidate, job or company..."
        filterComponent={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-11 w-44 rounded-2xl border border-input bg-card px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="SENT">Sent</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        }
      />
    </div>
  );
}
