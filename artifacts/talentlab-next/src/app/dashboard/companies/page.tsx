"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCompanies } from "@/modules/company/hooks/useCompanies";
import { useCreateCompany } from "@/modules/company/hooks/useCreateCompany";
import { useDeleteCompany } from "@/modules/company/hooks/useDeleteCompany";
import { Company, CompanyFilters } from "@/modules/company/types";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { CompanyForm } from "@/modules/company/components/CompanyForm";
import { useToast } from "@/providers/ToastProvider";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Plus,
  Globe,
  Users,
  Briefcase,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Trash2,
} from "lucide-react";

const COMPANY_TYPE_LABELS: Record<string, string> = {
  PRIVATE_LIMITED: "Pvt Ltd",
  PUBLIC_LIMITED: "Public Ltd",
  LLP: "LLP",
  PARTNERSHIP: "Partnership",
  PROPRIETORSHIP: "Proprietorship",
  OTHER: "Other",
};

const INDUSTRY_OPTIONS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Retail",
  "Education",
  "Real Estate",
  "FMCG",
  "Logistics",
  "Media & Entertainment",
  "Consulting",
  "Automotive",
  "Construction",
  "Energy",
  "Hospitality",
  "Other",
];

export default function CompaniesListPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Filter + pagination state
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [status, setStatus] = useState<"active" | "archived" | "">("");
  const [companyType, setCompanyType] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([undefined]);
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 12;

  const filters: CompanyFilters = {
    search: search || undefined,
    industry: industry || undefined,
    status: (status as "active" | "archived") || undefined,
    companyType: companyType || undefined,
    limit,
    cursor,
    sortBy: "createdAt",
    sortOrder: "desc",
  };

  const { data, isLoading, error } = useCompanies(filters);
  const createMutation = useCreateCompany();
  const deleteMutation = useDeleteCompany();

  const companies: Company[] = data?.data || [];
  const hasMore = data?.hasMore || false;
  const total = data?.total || 0;
  const nextCursor = data?.nextCursor || null;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Columns
  const columns: Column<Company>[] = [
    {
      key: "logo",
      label: "",
      render: (item) => (
        <div className="h-9 w-9 rounded-2xl bg-pastel-blue/30 text-pastel-blue-ink font-extrabold flex items-center justify-center text-xs shrink-0 select-none">
          {item.name.substring(0, 2).toUpperCase()}
        </div>
      ),
    },
    {
      key: "name",
      label: "Company",
      sortable: true,
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-foreground">{item.name}</span>
            {item.archivedAt && (
              <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded uppercase tracking-wider border border-orange-500/20">
                Archived
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {item.companyType ? COMPANY_TYPE_LABELS[item.companyType] : "N/A"}{" "}
            {item.industry ? `• ${item.industry}` : ""}
          </span>
        </div>
      ),
    },
    {
      key: "contact",
      label: "Contact",
      render: (item) => (
        <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
          {item.email && <span className="truncate max-w-[180px]">{item.email}</span>}
          {item.phone && <span>{item.phone}</span>}
          {!item.email && !item.phone && <span className="italic">No contact</span>}
        </div>
      ),
    },
    {
      key: "website",
      label: "Website",
      render: (item) =>
        item.website ? (
          <a
            href={item.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-[10px] text-primary hover:underline font-semibold"
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="truncate max-w-[120px]">
              {item.website.replace(/^https?:\/\//, "")}
            </span>
          </a>
        ) : (
          <span className="text-[10px] text-muted-foreground italic">—</span>
        ),
    },
    {
      key: "employees",
      label: "Headcount",
      render: (item) => (
        <span className="text-xs font-semibold text-muted-foreground">
          {item.employeeCount ? item.employeeCount.toLocaleString() : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Registered",
      render: (item) => (
        <span className="text-[10px] text-muted-foreground font-semibold">
          {new Date(item.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  const handleRowClick = (company: Company) => {
    router.push(`/dashboard/companies/${company.id}`);
  };

  const handleCreate = async (values: any) => {
    try {
      await createMutation.mutateAsync(values);
      toast("Company profile created successfully!", "success");
      setIsCreateModalOpen(false);
    } catch (err: any) {
      toast(err.message || "Failed to create company.", "error");
    }
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    if (!confirm(`Delete ${selectedIds.length} company profile(s)?`)) return;
    let count = 0;
    for (const id of selectedIds) {
      try {
        await deleteMutation.mutateAsync(id);
        count++;
      } catch {}
    }
    if (count > 0) toast(`Deleted ${count} company profile(s).`, "success");
  };

  const goNextPage = () => {
    if (!nextCursor) return;
    setCursorHistory((prev) => [...prev, nextCursor]);
    setCursor(nextCursor);
    setCurrentPage((p) => p + 1);
  };

  const goPrevPage = () => {
    if (currentPage === 0) return;
    const prevHistory = [...cursorHistory];
    prevHistory.pop();
    const prevCursor = prevHistory[prevHistory.length - 1];
    setCursorHistory(prevHistory);
    setCursor(prevCursor);
    setCurrentPage((p) => p - 1);
  };

  const resetFilters = () => {
    setSearch("");
    setIndustry("");
    setStatus("");
    setCompanyType("");
    setCursor(undefined);
    setCursorHistory([undefined]);
    setCurrentPage(0);
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-pastel-blue-ink" />
            <span>Company CRM</span>
          </h1>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            Manage client company profiles, contacts, documents, and open job pipelines.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="h-10 px-5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Company</span>
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Companies",
            value: total,
            icon: Building2,
            color: "text-pastel-blue-ink bg-pastel-blue/20 border-pastel-blue/20",
          },
          {
            label: "Active",
            value: data?.data?.filter((c) => !c.archivedAt).length ?? 0,
            icon: TrendingUp,
            color: "text-pastel-green-ink bg-pastel-green/20 border-pastel-green/20",
          },
          {
            label: "Contacts Registered",
            value: data?.data?.reduce((sum, c) => sum + (c.contacts?.length || 0), 0) ?? 0,
            icon: Users,
            color: "text-pastel-pink bg-pastel-pink/10 border-pastel-pink/20",
          },
          {
            label: "Open Recruitments",
            value: "—",
            icon: Briefcase,
            color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="bg-card/40 backdrop-blur-md border border-border/60 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-black text-foreground">{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl border shrink-0 ${stat.color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCursor(undefined); setCurrentPage(0); setCursorHistory([undefined]); }}
            placeholder="Search companies..."
            className="flex h-11 w-full rounded-2xl border border-input bg-card pl-9 pr-4 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
          />
        </div>

        <select
          value={industry}
          onChange={(e) => { setIndustry(e.target.value); setCursor(undefined); setCurrentPage(0); setCursorHistory([undefined]); }}
          className="h-11 rounded-2xl border border-input bg-card px-4 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
        >
          <option value="">All Industries</option>
          {INDUSTRY_OPTIONS.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
        </select>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as any); setCursor(undefined); setCurrentPage(0); setCursorHistory([undefined]); }}
          className="h-11 rounded-2xl border border-input bg-card px-4 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={companyType}
          onChange={(e) => { setCompanyType(e.target.value); setCursor(undefined); setCurrentPage(0); setCursorHistory([undefined]); }}
          className="h-11 rounded-2xl border border-input bg-card px-4 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
        >
          <option value="">All Types</option>
          <option value="PRIVATE_LIMITED">Pvt Ltd</option>
          <option value="PUBLIC_LIMITED">Public Ltd</option>
          <option value="LLP">LLP</option>
          <option value="PARTNERSHIP">Partnership</option>
          <option value="PROPRIETORSHIP">Proprietorship</option>
        </select>

        {(search || industry || status || companyType) && (
          <button
            onClick={resetFilters}
            className="text-[10px] text-muted-foreground hover:text-foreground font-bold cursor-pointer transition-all"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Data Table */}
      <DataTable<Company>
        columns={columns}
        data={companies}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        bulkActions={(selectedIds) => (
          <Button
            variant="destructive"
            onClick={() => handleBulkDelete(selectedIds)}
            className="h-9 px-4 text-xs flex items-center gap-1.5 cursor-pointer rounded-xl"
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete ({selectedIds.length})</span>
          </Button>
        )}
      />

      {/* Cursor Pagination Footer */}
      {(currentPage > 0 || hasMore) && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-muted-foreground font-semibold">
            Showing page {currentPage + 1} · {total} total companies
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={goPrevPage}
              disabled={currentPage === 0}
              className="h-9 px-4 text-xs rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={goNextPage}
              disabled={!hasMore}
              className="h-9 px-4 text-xs rounded-xl flex items-center gap-1 cursor-pointer"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register New Company"
      >
        <CompanyForm
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      </Dialog>
    </div>
  );
}
