"use client";

import React, { useState } from "react";
import { KPIGrid } from "@/components/ui/KPIGrid";
import { useAssessmentMetrics } from "@/modules/assessment/hooks/useAssessmentMetrics";
import { useAssessmentTests } from "@/modules/assessment/hooks/useAssessmentTests";
import { QuestionBankTab } from "@/modules/assessment/components/QuestionBankTab";
import { TemplatesTab } from "@/modules/assessment/components/TemplatesTab";
import { AssignTestModal } from "@/modules/assessment/components/AssignTestModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ListChecks, HelpCircle, FileSpreadsheet, ClipboardList, CheckCircle2, AlertOctagon, RefreshCw, BarChart2 } from "lucide-react";
import Link from "next/link";

export default function AssessmentDashboardPage() {
  const [activeTab, setActiveTab] = useState<"tests" | "questions" | "templates">("tests");
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Queries
  const { data: metrics, isLoading: loadingMetrics, refetch: refetchMetrics } = useAssessmentMetrics();
  const { data: tests, isLoading: loadingTests, refetch: refetchTests } = useAssessmentTests({
    page,
    pageSize: 10,
  });

  const handleRefresh = () => {
    refetchMetrics();
    refetchTests();
  };

  const getVerdictBadge = (verdict: string | null, startedAt: string | null, completedAt: string | null) => {
    if (completedAt) {
      if (verdict === "PASS") {
        return (
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200">
            Passed
          </span>
        );
      } else {
        return (
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200">
            Failed
          </span>
        );
      }
    }
    if (startedAt) {
      return (
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 animate-pulse">
          In Progress
        </span>
      );
    }
    return (
      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
        Pending
      </span>
    );
  };

  const kpiCards = [
    {
      title: "Pass Rate",
      value: loadingMetrics ? "..." : `${metrics?.passRate || 0}%`,
      subtitle: "Avg. candidate standard",
      colorClassName: "bg-green-500/10 text-green-600 dark:text-green-400",
      icon: <BarChart2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
    },
    {
      title: "Completed Exams",
      value: loadingMetrics ? "..." : String((metrics?.passed || 0) + (metrics?.failed || 0)),
      subtitle: "Graded & evaluated",
      colorClassName: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      icon: <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: "Assigned & Pending",
      value: loadingMetrics ? "..." : String(metrics?.pending || 0),
      subtitle: "Scheduled/invitations sent",
      colorClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      icon: <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
    },
    {
      title: "Average Score",
      value: loadingMetrics ? "..." : `${metrics?.averagePercentage || 0}%`,
      subtitle: "Overall test benchmark",
      colorClassName: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      icon: <ListChecks className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Upper header action area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Assessment & Exam Engine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage candidate test cycles, MCQ questions bank, and evaluation reports.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button onClick={handleRefresh} variant="outline" size="sm" className="h-10 w-10 p-0 rounded-xl">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsAssignOpen(true)} className="rounded-xl flex items-center gap-1.5 text-xs h-10 px-4 flex-1 sm:flex-initial">
            <Plus className="h-4 w-4" />
            <span>Assign Test</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <KPIGrid cards={kpiCards} />

      {/* Dynamic module tabs selector */}
      <div className="flex border-b border-border/40 gap-6">
        <button
          onClick={() => setActiveTab("tests")}
          className={`pb-3 text-sm font-bold uppercase tracking-wider relative transition-colors ${
            activeTab === "tests" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {activeTab === "tests" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full" />
          )}
          Assigned Tests
        </button>
        <button
          onClick={() => setActiveTab("questions")}
          className={`pb-3 text-sm font-bold uppercase tracking-wider relative transition-colors ${
            activeTab === "questions" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {activeTab === "questions" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full" />
          )}
          Question Bank
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-3 text-sm font-bold uppercase tracking-wider relative transition-colors ${
            activeTab === "templates" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {activeTab === "templates" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full" />
          )}
          Templates
        </button>
      </div>

      {/* Render selected active Tab panel */}
      {activeTab === "tests" && (
        <Card className="rounded-2xl border bg-card/40 backdrop-blur-md">
          <CardContent className="p-0">
            {loadingTests ? (
              <div className="text-center py-16 text-xs text-muted-foreground font-semibold">Loading assignments log...</div>
            ) : !tests || tests.items.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm font-bold text-foreground">No Test Assignments Registered</p>
                <p className="text-xs text-muted-foreground">Assign your first candidate test using the button above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/40 font-extrabold uppercase text-[10px] tracking-wider text-muted-foreground">
                      <th className="p-4">Candidate</th>
                      <th className="p-4">Job Role</th>
                      <th className="p-4">Template</th>
                      <th className="p-4 text-center">Score %</th>
                      <th className="p-4">Status / Verdict</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {tests.items.map((t: any) => (
                      <tr key={t.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4 font-bold text-foreground">
                          <div>
                            <span className="text-sm block">{t.pipeline?.candidate?.name || "Unknown"}</span>
                            <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">{t.pipeline?.candidate?.email || ""}</span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground font-semibold">
                          {t.pipeline?.job?.title || "N/A"}
                        </td>
                        <td className="p-4 font-medium text-foreground">
                          {t.template?.name || "Custom Mix"}
                        </td>
                        <td className="p-4 text-center font-black text-sm text-foreground">
                          {t.completedAt ? `${t.percentage}%` : "—"}
                        </td>
                        <td className="p-4">
                          {getVerdictBadge(t.verdict, t.startedAt, t.completedAt)}
                        </td>
                        <td className="p-4 text-right space-x-2 shrink-0">
                          {/* Workspace detail link */}
                          <Link href={`/dashboard/assessment/${t.id}`}>
                            <Button variant="outline" size="sm" className="h-8 rounded-lg px-2 text-[10px]">
                              Workspace
                            </Button>
                          </Link>

                          {/* Candidate isolated test taker link (visible if pending/started) */}
                          {!t.completedAt && (
                            <Link href={`/dashboard/assessment/${t.id}/test`}>
                              <Button size="sm" className="h-8 rounded-lg px-2 text-[10px] bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
                                Launch Test
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {tests.totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-border/20">
                    <span className="text-xs text-muted-foreground font-semibold">
                      Page {page} of {tests.totalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        variant="outline"
                        className="h-9 px-3 rounded-xl text-xs"
                      >
                        Previous
                      </Button>
                      <Button
                        disabled={page === tests.totalPages}
                        onClick={() => setPage(p => p + 1)}
                        variant="outline"
                        className="h-9 px-3 rounded-xl text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "questions" && <QuestionBankTab />}
      {activeTab === "templates" && <TemplatesTab />}

      {/* Assign Test Modal Form */}
      <AssignTestModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
