import React from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCompanies } from "@/modules/company/hooks/useCompanies";
import { useJobs } from "@/modules/job/hooks/useJobs";
import { PipelineFilters } from "../types";
import { Search, X, Sparkles, Filter } from "lucide-react";

interface PipelineFiltersBarProps {
  filters: PipelineFilters;
  onFiltersChange: (filters: PipelineFilters) => void;
  uniqueRecruiters: Array<{ id: string; name: string }>;
  uniqueTags: string[];
}

export function PipelineFiltersBar({
  filters,
  onFiltersChange,
  uniqueRecruiters,
  uniqueTags,
}: PipelineFiltersBarProps) {
  const { data: companiesResult, isLoading: isLoadingCompanies } = useCompanies();
  const companies = companiesResult?.data || [];
  const { data: jobs = [], isLoading: isLoadingJobs } = useJobs();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value });
  };

  const handleSelectChange = (key: keyof PipelineFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  const handleClear = () => {
    onFiltersChange({});
  };

  const companyOptions = [
    { value: "", label: "All Companies" },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  const jobOptions = [
    { value: "", label: "All Jobs" },
    ...jobs.map((j) => ({ value: j.id, label: `${j.title} (${j.code || "No Code"})` })),
  ];

  const recruiterOptions = [
    { value: "", label: "All Recruiters" },
    ...uniqueRecruiters.map((r) => ({ value: r.id, label: r.name })),
  ];

  const priorityOptions = [
    { value: "", label: "All Priorities" },
    { value: "CRITICAL", label: "Critical" },
    { value: "HIGH", label: "High" },
    { value: "NORMAL", label: "Normal" },
  ];

  const sourceOptions = [
    { value: "", label: "All Sources" },
    { value: "REFERRAL", label: "Referral" },
    { value: "PORTAL", label: "Job Portal" },
    { value: "SOCIAL", label: "Social Media" },
    { value: "INTERNAL", label: "Internal Referral" },
    { value: "DIRECT", label: "Direct Application" },
  ];

  const tagOptions = [
    { value: "", label: "All Tags" },
    ...uniqueTags.map((t) => ({ value: t, label: t })),
  ];

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined);

  return (
    <div className="bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/20 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-pastel-pink" />
          <h2 className="text-sm font-extrabold tracking-wide uppercase text-foreground/90">
            Pipeline Search & Filters
          </h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="text-xs font-bold text-pastel-pink-ink hover:text-pastel-pink flex items-center gap-1 hover:underline cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear Active Filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-muted-foreground" />
          <Input
            value={filters.search || ""}
            onChange={handleSearchChange}
            placeholder="Search candidate name or email..."
            className="pl-9 h-11 rounded-2xl border-border/70"
          />
        </div>

        {/* Company select */}
        <Select
          options={companyOptions}
          value={filters.companyId || ""}
          disabled={isLoadingCompanies}
          onChange={(e) => handleSelectChange("companyId", e.target.value)}
          className="border-border/70"
        />

        {/* Job select */}
        <Select
          options={jobOptions}
          value={filters.jobId || ""}
          disabled={isLoadingJobs}
          onChange={(e) => handleSelectChange("jobId", e.target.value)}
          className="border-border/70"
        />

        {/* Recruiter select */}
        <Select
          options={recruiterOptions}
          value={filters.assignedRecruiterId || ""}
          onChange={(e) => handleSelectChange("assignedRecruiterId", e.target.value)}
          className="border-border/70"
        />

        {/* Priority select */}
        <Select
          options={priorityOptions}
          value={filters.priority || ""}
          onChange={(e) => handleSelectChange("priority", e.target.value)}
          className="border-border/70"
        />

        {/* Source select */}
        <Select
          options={sourceOptions}
          value={filters.source || ""}
          onChange={(e) => handleSelectChange("source", e.target.value)}
          className="border-border/70"
        />

        {/* Tag select */}
        <Select
          options={tagOptions}
          value={filters.tag || ""}
          onChange={(e) => handleSelectChange("tag", e.target.value)}
          className="border-border/70"
        />

        {/* Show Rejected/Archived toggle option */}
        <div className="flex items-center justify-end sm:justify-start">
          <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.showArchived || false}
              onChange={(e) => onFiltersChange({ ...filters, showArchived: e.target.checked })}
              className="h-4.5 w-4.5 rounded-lg border-border text-primary focus:ring-primary/40 bg-card cursor-pointer"
            />
            <span>Show Rejected / Dropped</span>
          </label>
        </div>
      </div>
    </div>
  );
}
