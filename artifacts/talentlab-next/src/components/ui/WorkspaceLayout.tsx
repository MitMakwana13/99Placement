import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface WorkspaceTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface WorkspaceLayoutProps {
  title: string;
  subtitle?: string;
  entityLabel?: string; // e.g. "Candidate Workspace", "Company CRM", "Screening Workspace"
  backUrl: string;
  backLabel: string;
  actions?: React.ReactNode;
  headerMeta?: React.ReactNode;
  tabs: WorkspaceTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
}

export function WorkspaceLayout({
  title,
  subtitle,
  entityLabel,
  backUrl,
  backLabel,
  actions,
  headerMeta,
  tabs,
  activeTab,
  onTabChange,
  children,
}: WorkspaceLayoutProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div>
        <button
          onClick={() => router.push(backUrl)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-bold tracking-wide transition-all uppercase cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{backLabel}</span>
        </button>
      </div>

      {/* Main Header Card */}
      <div className="bg-card/45 backdrop-blur-md border border-border/80 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {entityLabel && (
                <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  {entityLabel}
                </span>
              )}
              {headerMeta}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            {actions}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-border/30 pt-4 flex gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap",
                  isActive
                    ? "bg-foreground text-background border-foreground shadow-sm scale-[1.02]"
                    : "bg-transparent text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/40"
                )}
              >
                {tab.icon && <span className={cn("h-4 w-4", isActive ? "text-background" : "text-muted-foreground")}>{tab.icon}</span>}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Workspace Panel Content */}
      <div className="transition-all duration-300">
        {children}
      </div>
    </div>
  );
}
