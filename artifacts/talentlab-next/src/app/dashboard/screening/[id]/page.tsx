"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useScreening } from "@/modules/screening/hooks/useScreening";
import { useRescheduleScreening } from "@/modules/screening/hooks/useRescheduleScreening";
import { useCancelScreening } from "@/modules/screening/hooks/useCancelScreening";
import { useRestoreScreening } from "@/modules/screening/hooks/useRestoreScreening";
import { WorkspaceLayout } from "@/components/ui/WorkspaceLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ScreeningScorecardForm } from "@/modules/screening/components/ScreeningScorecardForm";
import { useToast } from "@/providers/ToastProvider";
import {
  Calendar,
  Clock,
  User,
  Briefcase,
  AlertTriangle,
  Award,
  DollarSign,
  FileText,
  History,
  MessageSquare,
  Sparkles,
  CheckCircle,
  HelpCircle,
  XCircle,
  ArrowLeft,
  Compass,
} from "lucide-react";

type ActiveTab = "overview" | "scorecard" | "compensation" | "notes" | "documents" | "timeline";

export default function ScreeningDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = typeof params.id === "string" ? params.id : "";

  // Query / Mutation hooks
  const { data: screening, isLoading, error, refetch } = useScreening(id);
  const rescheduleMutation = useRescheduleScreening();
  const cancelMutation = useCancelScreening();
  const restoreMutation = useRestoreScreening();

  // Component states
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleMode, setRescheduleMode] = useState<any>("phone");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-xs text-muted-foreground font-semibold">Loading screening files...</span>
      </div>
    );
  }

  if (error || !screening) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-pastel-pink-ink bg-pastel-pink/20 p-2.5 rounded-full" />
        <div className="text-center">
          <h3 className="font-extrabold text-foreground">Screening Review Not Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            This interview request has been archived or deleted.
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/screening")} variant="outline" className="rounded-xl flex items-center gap-1.5 text-xs">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Screening List</span>
        </Button>
      </div>
    );
  }

  const candidate = screening.pipeline?.candidate;
  const job = screening.pipeline?.job;
  const interviewer = screening.interviewer;

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this screening?")) return;
    try {
      await cancelMutation.mutateAsync({ id, reason: "Cancelled by coordinator" });
      toast("Screening cancelled successfully", "success");
      refetch();
    } catch (err: any) {
      toast(err.message || "Failed to cancel screening.", "error");
    }
  };

  const handleRestore = async () => {
    try {
      await restoreMutation.mutateAsync(id);
      toast("Screening session restored!", "success");
      refetch();
    } catch (err: any) {
      toast(err.message || "Failed to restore screening.", "error");
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate) {
      toast("Please pick a reschedule date and time", "error");
      return;
    }
    if (new Date(rescheduleDate) <= new Date()) {
      toast("New schedule date must be in the future", "error");
      return;
    }

    try {
      await rescheduleMutation.mutateAsync({
        id,
        data: {
          scheduledAt: new Date(rescheduleDate).toISOString(),
          mode: rescheduleMode,
        },
      });
      toast("Screening interview rescheduled!", "success");
      setIsRescheduleOpen(false);
      refetch();
    } catch (err: any) {
      toast(err.message || "Failed to reschedule screening.", "error");
    }
  };

  // Header meta badge styling
  const getHeaderMetaBadge = () => {
    if (screening.deletedAt) {
      return (
        <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">
          Cancelled
        </span>
      );
    }
    if (!screening.verdict) {
      return (
        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
          Scheduled / Pending Review
        </span>
      );
    }
    const verdictColors: Record<string, string> = {
      SHORTLIST: "bg-green-100 text-green-700 border-green-200",
      HOLD: "bg-yellow-100 text-yellow-700 border-yellow-200",
      REJECT: "bg-red-100 text-red-700 border-red-200",
    };
    return (
      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${verdictColors[screening.verdict]}`}>
        {screening.verdict}
      </span>
    );
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <Clock className="h-4 w-4" /> },
    { id: "scorecard", label: "Scorecard Review", icon: <Award className="h-4 w-4" /> },
    { id: "compensation", label: "Compensation & Notice", icon: <DollarSign className="h-4 w-4" /> },
    { id: "notes", label: "Notes & Instructions", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "documents", label: "Attachments", icon: <FileText className="h-4 w-4" /> },
    { id: "timeline", label: "Workflow History", icon: <History className="h-4 w-4" /> },
  ];

  return (
    <WorkspaceLayout
      title={`${candidate?.name || "Candidate Evaluation"} — Initial screening`}
      subtitle={`Scheduled for job post: ${job?.title || "N/A"}`}
      entityLabel="Screening Workspace"
      backUrl="/dashboard/screening"
      backLabel="Back to Screening Dashboard"
      headerMeta={getHeaderMetaBadge()}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as ActiveTab)}
      actions={
        <div className="flex items-center gap-2">
          {!screening.verdict && !screening.deletedAt && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRescheduleDate("");
                  setRescheduleMode(screening.mode);
                  setIsRescheduleOpen(true);
                }}
                className="h-10 px-4 rounded-xl text-xs font-bold"
              >
                Reschedule
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancel}
                className="h-10 px-4 rounded-xl text-xs font-bold"
              >
                Cancel Interview
              </Button>
            </>
          )}
          {screening.deletedAt && (
            <Button
              onClick={handleRestore}
              className="h-10 px-4 rounded-xl text-xs font-bold"
            >
              Restore Session
            </Button>
          )}
        </div>
      }
    >
      {/* ── Tab: Overview ────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-2xl border bg-card/45 backdrop-blur-md shadow-sm">
              <CardHeader className="border-b border-border/20">
                <CardTitle className="text-sm font-black uppercase text-foreground/80">Evaluation Details</CardTitle>
                <CardDescription className="text-[10px]">Primary screening instructions and scheduled logistics.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">Scheduled Date</span>
                    <span className="text-sm font-semibold text-foreground">
                      {new Date(screening.scheduledAt).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">Scheduled Time</span>
                    <span className="text-sm font-semibold text-foreground">
                      {new Date(screening.scheduledAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">Meeting Mode</span>
                    <span className="text-sm font-semibold text-foreground capitalize">
                      {screening.mode.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">Recruiter / Interviewer</span>
                    <span className="text-sm font-semibold text-foreground">
                      {interviewer?.name || "System Automated"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border/20 pt-4 space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block">Initial Coordinator Notes</span>
                  <div className="bg-muted/40 p-4 rounded-xl border border-border/30 text-xs text-foreground/90 whitespace-pre-line">
                    {screening.notes || "No notes or specific instructions logged for this scheduled session."}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Quick Context Card */}
            <Card className="rounded-2xl border bg-card/45 backdrop-blur-md shadow-sm">
              <CardHeader className="border-b border-border/20">
                <CardTitle className="text-sm font-black uppercase text-foreground/80">Candidate Profile Context</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-pastel-pink/15 rounded-xl border border-pastel-pink/20 shrink-0">
                    <User className="h-4 w-4 text-pastel-pink" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground block">{candidate?.name}</span>
                    <span className="text-[10px] text-muted-foreground">{candidate?.email}</span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">{candidate?.phone || "No phone added"}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-border/20 pt-4">
                  <div className="p-2 bg-pastel-blue-ink/15 rounded-xl border border-pastel-blue-ink/20 shrink-0">
                    <Briefcase className="h-4 w-4 text-pastel-blue-ink" />
                  </div>
                  <div>
                    <span className="font-bold text-foreground block">{job?.title}</span>
                    <span className="text-[10px] text-muted-foreground">Code: {job?.code || "N/A"}</span>
                  </div>
                </div>

                {screening.pipeline && (
                  <div className="flex items-start gap-3 border-t border-border/20 pt-4">
                    <div className="p-2 bg-pastel-yellow/15 rounded-xl border border-pastel-yellow/20 shrink-0">
                      <Compass className="h-4 w-4 text-pastel-yellow-ink" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground block">Pipeline Stage</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">
                        {screening.pipeline.stage}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Tab: Scorecard ───────────────────────────────────────────────────────── */}
      {activeTab === "scorecard" && (
        <div className="space-y-6">
          {!screening.verdict ? (
            <Card className="rounded-2xl border bg-card/45 backdrop-blur-md shadow-sm">
              <CardHeader className="border-b border-border/20">
                <CardTitle className="text-sm font-black uppercase text-foreground/80">Submit Scorecard & Recommendation</CardTitle>
                <CardDescription className="text-[10px]">Evaluate dimensions, calculate score averages, and issue selection verdicts.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ScreeningScorecardForm
                  screeningId={id}
                  onSuccess={() => {
                    refetch();
                    setActiveTab("overview");
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="rounded-2xl border bg-card/45 backdrop-blur-md shadow-sm">
                  <CardHeader className="border-b border-border/20">
                    <CardTitle className="text-sm font-black uppercase text-foreground/80">Scorecard Ratings Matrix</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {[
                        { label: "Communication Skills", value: screening.communicationScore },
                        { label: "Technical Competence", value: screening.technicalScore },
                        { label: "Relevant Experience", value: screening.experienceScore },
                        { label: "Salary Alignment", value: screening.salaryAlignScore },
                        { label: "Notice Period Fit", value: screening.noticePeriodScore },
                        { label: "Culture & Personality", value: screening.personalityScore },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                            <span>{item.label}</span>
                            <span className="font-bold">{item.value ?? 0} / 10</span>
                          </div>
                          <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden border">
                            <div
                              className="h-full bg-foreground rounded-full transition-all"
                              style={{ width: `${(item.value ?? 0) * 10}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border/20 pt-6 space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block mb-1">
                          Conducted Recommendation Justification
                        </span>
                        <div className="bg-muted/40 p-4 rounded-xl border border-border/30 text-xs text-foreground/90 whitespace-pre-line font-medium leading-relaxed">
                          {screening.recommendation || "No recommendation summary was submitted."}
                        </div>
                      </div>

                      {screening.notes && (
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide block mb-1">
                            Additional Internal Feedback
                          </span>
                          <div className="bg-muted/30 p-4 rounded-xl border border-border/30 text-xs text-muted-foreground whitespace-pre-line">
                            {screening.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="rounded-2xl border bg-card/45 backdrop-blur-md shadow-sm text-center p-6 space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Evaluation Verdict</h3>
                    <div className="mt-2 flex justify-center">{getHeaderMetaBadge()}</div>
                  </div>

                  <div className="border-t border-border/20 pt-4">
                    <span className="text-3xl font-black text-foreground block">
                      {screening.overallScore ?? 0} / 10
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold">Average Overall Score</span>
                  </div>

                  <div className="border-t border-border/20 pt-4 text-xs text-muted-foreground">
                    Conducted on:{" "}
                    <span className="font-bold text-foreground">
                      {screening.conductedAt
                        ? new Date(screening.conductedAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Compensation ────────────────────────────────────────────────────── */}
      {activeTab === "compensation" && (
        <Card className="rounded-2xl border bg-card/45 backdrop-blur-md shadow-sm">
          <CardHeader className="border-b border-border/20">
            <CardTitle className="text-sm font-black uppercase text-foreground/80">Compensation & Joining Details</CardTitle>
            <CardDescription className="text-[10px]">Salary alignment and notice period details disclosed by candidate during initial call.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-muted/35 p-5 rounded-2xl border border-border/40 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Current Salary (CTC)</span>
                <span className="text-lg font-black text-foreground">
                  {screening.currentCtcDisclosed
                    ? `₹ ${screening.currentCtcDisclosed.toLocaleString()}`
                    : "Not Disclosed / N/A"}
                </span>
                <span className="text-[9px] text-muted-foreground block">Per Annum (INR)</span>
              </div>

              <div className="bg-muted/35 p-5 rounded-2xl border border-border/40 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Expected Salary (CTC)</span>
                <span className="text-lg font-black text-foreground">
                  {screening.expectedCtcDisclosed
                    ? `₹ ${screening.expectedCtcDisclosed.toLocaleString()}`
                    : "Not Disclosed / N/A"}
                </span>
                <span className="text-[9px] text-muted-foreground block">Per Annum (INR)</span>
              </div>

              <div className="bg-muted/35 p-5 rounded-2xl border border-border/40 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Notice Period Duration</span>
                <span className="text-lg font-black text-foreground animate-pulse">
                  {screening.noticePeriodDays !== null && screening.noticePeriodDays !== undefined
                    ? `${screening.noticePeriodDays} Days`
                    : "Not Specified"}
                </span>
                <span className="text-[9px] text-muted-foreground block">Notice Period Calendar</span>
              </div>

              <div className="bg-muted/35 p-5 rounded-2xl border border-border/40 space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Early Join Option</span>
                <span className="text-sm font-black text-foreground block pt-1.5">
                  {screening.canJoinEarlier ? "Yes — Negotiable / Buyout" : "No — Full notice required"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tab: Notes ───────────────────────────────────────────────────────────── */}
      {activeTab === "notes" && (
        <Card className="rounded-2xl border bg-card/45 backdrop-blur-md shadow-sm">
          <CardHeader className="border-b border-border/20">
            <CardTitle className="text-sm font-black uppercase text-foreground/80">Log Evaluation Notes</CardTitle>
            <CardDescription className="text-[10px]">Add observations, communication insights, and review notes.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              <div className="p-4 bg-muted/40 rounded-xl border border-border/30 text-xs text-foreground/90 space-y-1.5">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold">
                  <span>SYSTEM AUTO LOG</span>
                  <span>{new Date(screening.createdAt).toLocaleString()}</span>
                </div>
                <p>Initial screening session was registered in 99 Placement OS.</p>
              </div>

              {screening.notes && (
                <div className="p-4 bg-muted/30 rounded-xl border border-border/30 text-xs text-foreground/80 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold">
                    <span>INTERVIEWER REMARK</span>
                    <span>{screening.updatedAt ? new Date(screening.updatedAt).toLocaleString() : new Date(screening.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-line">{screening.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tab: Documents ───────────────────────────────────────────────────────── */}
      {activeTab === "documents" && (
        <Card className="rounded-2xl border bg-card/45 backdrop-blur-md shadow-sm">
          <CardHeader className="border-b border-border/20">
            <CardTitle className="text-sm font-black uppercase text-foreground/80">Evaluation Documents</CardTitle>
            <CardDescription className="text-[10px]">Candidate resumes, transcripts, and evaluation files.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="border border-dashed border-border/80 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Candidate CV & Files</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 max-w-sm">
                  Documents can be accessed from the primary Candidate detail workspace dashboard profile.
                </p>
              </div>
              {candidate?.id && (
                <Button
                  onClick={() => router.push(`/dashboard/candidates/${candidate.id}`)}
                  className="rounded-xl px-4 text-xs h-9"
                  variant="outline"
                >
                  View Candidate Dossier
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tab: Timeline ────────────────────────────────────────────────────────── */}
      {activeTab === "timeline" && (
        <Card className="rounded-2xl border bg-card/45 backdrop-blur-md shadow-sm">
          <CardHeader className="border-b border-border/20">
            <CardTitle className="text-sm font-black uppercase text-foreground/80">Workflow Activity Logs</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative pl-6 border-l-2 border-border/40 space-y-6">
              {/* Event 1 */}
              <div className="relative">
                <span className="absolute -left-[31px] top-1 bg-foreground text-background p-1 rounded-full border border-border">
                  <Clock className="h-3 w-3" />
                </span>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-foreground">Screening Session Scheduled</span>
                  <p className="text-[10px] text-muted-foreground">
                    Coordinator registered screening for candidate {candidate?.name || "N/A"}.
                  </p>
                  <span className="text-[9px] text-muted-foreground font-semibold block">
                    {new Date(screening.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Event 2 (Rescheduled) */}
              {screening.updatedAt && (
                <div className="relative">
                  <span className="absolute -left-[31px] top-1 bg-foreground text-background p-1 rounded-full border border-border">
                    <Calendar className="h-3 w-3" />
                  </span>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-foreground">Screening Details Updated</span>
                    <p className="text-[10px] text-muted-foreground">
                      Rescheduled date, mode, or notes were successfully updated on the server.
                    </p>
                    <span className="text-[9px] text-muted-foreground font-semibold block">
                      {new Date(screening.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Event 3 (Conducted) */}
              {screening.verdict && (
                <div className="relative">
                  <span className="absolute -left-[31px] top-1 bg-foreground text-background p-1 rounded-full border border-border">
                    <CheckCircle className="h-3 w-3" />
                  </span>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-foreground">Scorecard Decision Submitted</span>
                    <p className="text-[10px] text-muted-foreground">
                      Interviewer conducted evaluation. Marked candidate as <span className="font-extrabold">{screening.verdict}</span> with overall score of {screening.overallScore}/10.
                    </p>
                    <span className="text-[9px] text-muted-foreground font-semibold block font-mono">
                      {screening.conductedAt ? new Date(screening.conductedAt).toLocaleString() : "N/A"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reschedule Modal Dialog */}
      <Dialog
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title="Reschedule Screening Session"
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">New Date & Time *</label>
            <Input
              type="datetime-local"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="h-11 rounded-2xl border-border/70"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mode *</label>
            <Select
              value={rescheduleMode}
              onChange={(e) => setRescheduleMode(e.target.value)}
              options={[
                { value: "phone", label: "Phone Call" },
                { value: "video", label: "Video Call (Google Meet/Teams)" },
                { value: "in_person", label: "In Person Interview" },
              ]}
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border/20 pt-4 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRescheduleOpen(false)}
              className="rounded-xl px-4 text-xs h-10 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={rescheduleMutation.isPending}
              className="rounded-xl px-4 text-xs h-10 cursor-pointer"
            >
              {rescheduleMutation.isPending ? "Rescheduling..." : "Save Reschedule"}
            </Button>
          </div>
        </form>
      </Dialog>
    </WorkspaceLayout>
  );
}
