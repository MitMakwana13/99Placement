"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { joiningService } from "@/services/joining";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/providers/ToastProvider";
import {
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Clock,
  ThumbsUp,
  FileCheck,
  Loader,
} from "lucide-react";

export default function JoiningListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: joinings = [], isLoading, refetch } = useQuery({
    queryKey: ["joinings"],
    queryFn: joiningService.list,
  });

  // Client-side search and filters
  const filteredJoinings = joinings.filter((item) => {
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
      key: "joiningDate",
      label: "Confirmed Joining Date",
      render: (item) => {
        const d = item.joiningDate ? new Date(item.joiningDate) : null;
        if (!d) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <span className="text-xs text-foreground font-semibold text-pastel-pink-ink">
            {d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </span>
        );
      },
    },
    {
      key: "verification",
      label: "BGV Status",
      render: (item) => {
        const bgv = item.bgvStatus || "PENDING";
        const getBgvStyles = (b: string) => {
          switch (b) {
            case "VERIFIED":
              return "bg-green-500/10 text-green-500 border-green-500/20";
            case "FAILED":
              return "bg-red-500/10 text-red-500 border-red-500/20";
            case "INITIATED":
              return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            case "PENDING":
            default:
              return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
          }
        };
        return (
          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${getBgvStyles(bgv)}`}>
            {bgv}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Joining Status",
      render: (item) => {
        const status = item.status || "CONFIRMED";
        const getStyles = (s: string) => {
          switch (s) {
            case "JOINED":
              return "bg-pastel-green text-pastel-green-ink border-green-200/10";
            case "DELAYED":
              return "bg-pastel-yellow text-pastel-yellow-ink border-yellow-200/10";
            case "NO_SHOW":
              return "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200/10";
            case "CONFIRMED":
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
  const totalCount = joinings.length;
  const joinedCount = joinings.filter((x: any) => x.status === "JOINED").length;
  const confirmedCount = joinings.filter((x: any) => x.status === "CONFIRMED").length;
  const verifiedCount = joinings.filter((x: any) => x.bgvStatus === "VERIFIED").length;

  const stats = [
    {
      label: "Total Pipeline joiners",
      value: totalCount,
      icon: UserCheck,
      color: "text-pastel-pink bg-pastel-pink/10 border-pastel-pink/20",
    },
    {
      label: "Confirmed (Pending Join)",
      value: confirmedCount,
      icon: Calendar,
      color: "text-pastel-blue-ink bg-pastel-blue-ink/10 border-pastel-blue-ink/20",
    },
    {
      label: "Successfully Joined",
      value: joinedCount,
      icon: ThumbsUp,
      color: "text-green-500 bg-green-500/10 border-green-500/20",
    },
    {
      label: "BGV Clear Rate",
      value: totalCount ? `${Math.round((verifiedCount / totalCount) * 100)}%` : "0%",
      icon: ShieldCheck,
      color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Candidate Joining Workspace <span className="text-xs px-2.5 py-1 bg-primary/15 text-primary font-bold rounded-full border border-primary/20">Stage 6</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Coordinate notice period compliance, verify background checks (BGV), and track formal onboarding milestones.
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
        data={filteredJoinings}
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
            <option value="CONFIRMED">Confirmed</option>
            <option value="JOINED">Joined</option>
            <option value="DELAYED">Delayed</option>
            <option value="NO_SHOW">No Show</option>
          </select>
        }
      />
    </div>
  );
}
