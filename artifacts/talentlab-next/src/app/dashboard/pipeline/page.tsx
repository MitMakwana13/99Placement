"use client";

import React, { useState } from "react";
import { usePipelines } from "@/modules/pipeline/hooks/usePipelines";
import { PipelineFilters } from "@/modules/pipeline/types";
import { PipelineFiltersBar } from "@/modules/pipeline/components/PipelineFiltersBar";
import { KanbanBoard } from "@/modules/pipeline/components/KanbanBoard";
import { CandidateDrawer } from "@/modules/pipeline/components/CandidateDrawer";
import { PipelineItem } from "@/modules/pipeline/types";
import {
  GitPullRequest,
  Users,
  Briefcase,
  UserCheck,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

export default function PipelinePage() {
  const [filters, setFilters] = useState<PipelineFilters>({
    showArchived: false,
  });
  const [selectedItem, setSelectedItem] = useState<PipelineItem | null>(null);

  const { data, isLoading, error } = usePipelines(filters);
  const rawItems = data?.items || [];

  // Extract unique recruiters and tags dynamically from the full active dataset
  const uniqueRecruiters = Array.from(
    new Map(
      rawItems
        .filter((it) => it.assignedRecruiter)
        .map((it) => [it.assignedRecruiter!.id, it.assignedRecruiter!])
    ).values()
  );

  const uniqueTags = Array.from(
    new Set(rawItems.flatMap((it) => (it.tags || []).map((t) => t.name)))
  );

  // Apply client-side filters for instantaneous, lag-free UI updates
  let filteredItems = rawItems;

  // Filter out REJECTED/DROPPED by default unless checked
  if (!filters.showArchived) {
    filteredItems = filteredItems.filter(
      (it) => it.stage !== "REJECTED" && it.stage !== "DROPPED"
    );
  }

  if (filters.companyId) {
    filteredItems = filteredItems.filter((it) => it.job.companyId === filters.companyId);
  }

  if (filters.priority) {
    filteredItems = filteredItems.filter((it) => it.job.urgency === filters.priority);
  }

  if (filters.source) {
    filteredItems = filteredItems.filter(
      (it) => it.candidate.source?.toUpperCase() === filters.source?.toUpperCase()
    );
  }

  if (filters.tag) {
    filteredItems = filteredItems.filter((it) =>
      it.tags?.some((t) => t.name.toLowerCase() === filters.tag?.toLowerCase())
    );
  }

  // Calculate live statistics
  const totalCount = filteredItems.length;
  const sourcedCount = filteredItems.filter((it) => it.stage === "SOURCED").length;
  const interviewCount = filteredItems.filter((it) => it.stage === "CLIENT_INTERVIEW").length;
  const offerCount = filteredItems.filter((it) => it.stage === "OFFER").length;
  const joinedCount = filteredItems.filter((it) => it.stage === "POST_JOINING").length;

  const stats = [
    {
      label: "Active Pipelines",
      value: totalCount,
      icon: Users,
      color: "text-pastel-pink bg-pastel-pink/10 border-pastel-pink/20",
    },
    {
      label: "Sourced Candidates",
      value: sourcedCount,
      icon: GitPullRequest,
      color: "text-pastel-blue-ink bg-pastel-blue-ink/10 border-pastel-blue-ink/20",
    },
    {
      label: "In Client Interviews",
      value: interviewCount,
      icon: Briefcase,
      color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    },
    {
      label: "Offers Extended",
      value: offerCount,
      icon: UserCheck,
      color: "text-pastel-green-ink bg-pastel-green-ink/10 border-pastel-green-ink/20",
    },
    {
      label: "Joined / Hired",
      value: joinedCount,
      icon: CheckCircle,
      color: "text-green-500 bg-green-500/10 border-green-500/20",
    },
  ];

  return (
    <div className="space-y-6 max-w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <GitPullRequest className="h-6 w-6 text-pastel-pink" />
            <span>Recruitment Pipeline Kanban</span>
          </h1>
          <p className="text-xs text-muted-foreground font-semibold">
            Manage, filter, and track candidates stages from Sourced to Joined. Drag and drop cards to update status.
          </p>
        </div>
      </div>

      {/* KPI Stats Counters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className={`p-4 rounded-2xl border bg-card/45 backdrop-blur-md shadow-sm flex items-center justify-between gap-3`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {stat.label}
                </span>
                <span className="text-2xl font-black text-foreground">{stat.value}</span>
              </div>
              <div className={`p-2.5 rounded-xl border shrink-0 ${stat.color}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Advanced Filters */}
      <PipelineFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        uniqueRecruiters={uniqueRecruiters}
        uniqueTags={uniqueTags}
      />

      {/* Kanban Drag and Drop Board */}
      {isLoading ? (
        <div className="min-h-[400px] flex items-center justify-center bg-card/25 border border-border/60 rounded-2xl">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-xs text-muted-foreground font-bold animate-pulse">Loading board pipelines...</p>
          </div>
        </div>
      ) : error ? (
        <div className="min-h-[400px] flex items-center justify-center bg-card/25 border border-border/60 rounded-2xl text-center p-6">
          <div className="max-w-md space-y-3">
            <p className="text-sm font-bold text-red-400">Failed to load pipelines</p>
            <p className="text-xs text-muted-foreground">Please make sure the backend api service is up and running.</p>
          </div>
        </div>
      ) : (
        <KanbanBoard
          items={filteredItems}
          onCardClick={(item) => setSelectedItem(item)}
        />
      )}

      {/* Slide-over Candidate Drawer */}
      <CandidateDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
