"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsUpDown, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";
import { ListSkeleton, EmptyState } from "./states";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filterComponent?: React.ReactNode;
  bulkActions?: (selectedIds: string[]) => React.ReactNode;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (item: T) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (key: string, order: "asc" | "desc") => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search database records...",
  filterComponent,
  bulkActions,
  pagination,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Clear selections when data changes
  useEffect(() => {
    setSelectedIds([]);
  }, [data]);

  const toggleAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map((item) => item.id));
    }
  };

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering row click
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSortClick = (key: string) => {
    if (!onSort) return;
    const isCurrent = sortBy === key;
    const nextOrder = isCurrent && sortOrder === "asc" ? "desc" : "asc";
    onSort(key, nextOrder);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="flex-1 flex gap-3 items-center">
          {onSearchChange !== undefined && (
            <input
              type="text"
              value={searchQuery || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex h-11 w-full max-w-sm rounded-2xl border border-input bg-card px-4 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
            />
          )}
          {filterComponent}
        </div>

        {/* Render Bulk Action Button if selected rows exist */}
        {selectedIds.length > 0 && bulkActions && (
          <div className="animate-slide-up flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-semibold">
              {selectedIds.length} row(s) selected
            </span>
            {bulkActions(selectedIds)}
          </div>
        )}
      </div>

      {/* Main Table view container */}
      <Card className="border border-border/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border/60 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                {bulkActions && (
                  <th className="px-5 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={data.length > 0 && selectedIds.length === data.length}
                      onChange={toggleAll}
                      className="rounded border-input text-primary focus:ring-ring h-4 w-4"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSortClick(col.key)}
                    className={`px-5 py-4 font-semibold ${
                      col.sortable ? "cursor-pointer select-none hover:text-foreground" : ""
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      {col.sortable && (
                        sortBy === col.key ? (
                          sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
                        )
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + (bulkActions ? 1 : 0)} className="px-5 py-12">
                    <ListSkeleton />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (bulkActions ? 1 : 0)} className="px-5 py-12">
                    <EmptyState description="Configure search filters or create new candidate entries to populate this panel." />
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`group border-b border-border/20 transition-all ${
                      onRowClick ? "hover:bg-muted/20 cursor-pointer" : ""
                    }`}
                  >
                    {bulkActions && (
                      <td className="px-5 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={(e) => toggleRow(item.id, e as any)}
                          className="rounded border-input text-primary focus:ring-ring h-4 w-4 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-5 py-4 text-foreground/90 font-medium">
                        {col.render ? col.render(item) : (item as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination component controls */}
      {pagination && data.length > 0 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground font-semibold">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage === 1 || isLoading}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.currentPage === pagination.totalPages || isLoading}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
