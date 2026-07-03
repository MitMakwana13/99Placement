"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useJob } from "@/modules/job/hooks/useJob";
import { useUpdateJob } from "@/modules/job/hooks/useUpdateJob";
import { useDeleteJob } from "@/modules/job/hooks/useDeleteJob";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { JobForm } from "@/modules/job/components/JobForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/providers/ToastProvider";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Calendar,
  Sparkles,
  Edit,
  Trash2,
  FileText,
  Users,
  History,
  Info,
  DollarSign,
  AlertTriangle,
  BadgeAlert,
  FolderOpen
} from "lucide-react";
import { Job } from "@/modules/job/types";

type TabType = "overview" | "team" | "timeline" | "documents";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = typeof params.id === "string" ? params.id : "";

  // Query hooks
  const { data: job, isLoading, error } = useJob(id);
  const updateMutation = useUpdateJob();
  const deleteMutation = useDeleteJob();

  // State
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditSubmit = async (values: any) => {
    try {
      await updateMutation.mutateAsync({ id, data: values });
      toast("Job opening updated successfully!", "success");
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast(err.message || "Failed to update job opening.", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this job posting?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast("Job posting deleted successfully.", "success");
      router.push("/dashboard/jobs");
    } catch (err: any) {
      toast(err.message || "Failed to delete job posting.", "error");
    }
  };

  const handleStatusChange = async (newStatus: Job["status"]) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status: newStatus } });
      toast(`Job status updated to ${newStatus.replace("_", " ")}`, "success");
    } catch (err: any) {
      toast(err.message || "Failed to update job status.", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-xs text-muted-foreground font-semibold">Loading job configuration...</span>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-pastel-pink-ink bg-pastel-pink/20 p-2.5 rounded-full" />
        <div className="text-center">
          <h3 className="font-extrabold text-foreground">Job Posting Not Found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            The job posting is archived, deleted, or you lack access permissions.
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/jobs")} variant="outline" className="rounded-xl flex items-center gap-1.5 text-xs">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Jobs</span>
        </Button>
      </div>
    );
  }

  // Formatting helpers
  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (min === null && max === null) return "Not disclosed";
    if (min !== null && max !== null) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min !== null) return `From ${currency} ${min.toLocaleString()}`;
    if (max !== null) return `Up to ${currency} ${max.toLocaleString()}`;
    return "Not disclosed";
  };

  const formatExperience = (min: number | null, max: number | null) => {
    if (min === null && max === null) return "Any experience level";
    if (min !== null && max !== null) return `${min} - ${max} years`;
    if (min !== null) return `Min ${min} years`;
    if (max !== null) return `Up to ${max} years`;
    return "Any experience level";
  };

  const urgencyStyles: Record<Job["urgency"], string> = {
    CRITICAL: "bg-pastel-pink text-pastel-pink-ink border-pink-200/10",
    HIGH: "bg-pastel-yellow text-pastel-yellow-ink border-yellow-200/10",
    NORMAL: "bg-pastel-blue text-pastel-blue-ink border-blue-200/10",
  };

  const statusStyles: Record<Job["status"], string> = {
    OPEN: "bg-pastel-green text-pastel-green-ink border-green-200/10",
    APPROVED: "bg-pastel-green text-pastel-green-ink border-green-200/10",
    DRAFT: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200/10",
    PENDING_APPROVAL: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/10",
    CLOSED: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200/10",
    ARCHIVED: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200/10",
    CANCELLED: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200/10",
    ON_HOLD: "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 border-orange-200/10",
  };

  return (
    <div className="space-y-6">
      {/* Header and Back navigation */}
      <div className="flex flex-col gap-4">
        <div>
          <button
            onClick={() => router.push("/dashboard/jobs")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-all mb-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Job Board</span>
          </button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  {job.title}
                </h1>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-lg bg-muted text-muted-foreground border border-border/20">
                  {job.code || "NO-CODE"}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${urgencyStyles[job.urgency]}`}>
                  {job.urgency} Urgency
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusStyles[job.status]}`}>
                  {job.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <span>at</span>
                <span className="font-semibold text-foreground">{job.company?.name || "Internal Workspace"}</span>
                <span>•</span>
                <MapPin className="h-3.5 w-3.5" />
                <span>{job.location}</span>
                <span>•</span>
                <span className="capitalize font-semibold text-foreground">{job.jobType.replace("_", " ")}</span>
              </p>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex items-center gap-2 flex-wrap">
              {job.status === "OPEN" ? (
                <Button
                  onClick={() => handleStatusChange("ON_HOLD")}
                  variant="outline"
                  className="rounded-xl h-10 text-xs font-semibold cursor-pointer border-orange-200/20 text-orange-600 hover:bg-orange-50/20"
                >
                  Hold Opening
                </Button>
              ) : (
                <Button
                  onClick={() => handleStatusChange("OPEN")}
                  variant="outline"
                  className="rounded-xl h-10 text-xs font-semibold cursor-pointer border-green-200/20 text-green-600 hover:bg-green-50/20"
                >
                  Activate Job
                </Button>
              )}

              {job.status !== "CLOSED" && (
                <Button
                  onClick={() => handleStatusChange("CLOSED")}
                  variant="outline"
                  className="rounded-xl h-10 text-xs font-semibold cursor-pointer border-red-200/20 text-red-600 hover:bg-red-50/20"
                >
                  Close Opening
                </Button>
              )}

              <Button
                onClick={() => setIsEditModalOpen(true)}
                variant="outline"
                className="rounded-xl h-10 px-4 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Job</span>
              </Button>

              <Button
                onClick={handleDelete}
                variant="destructive"
                className="rounded-xl h-10 px-4 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="border-b border-border/60">
        <div className="flex space-x-6">
          {(["overview", "team", "timeline", "documents"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-bold capitalize border-b-2 transition-all cursor-pointer relative ${
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "overview" && "Overview"}
              {tab === "team" && "Assigned Team"}
              {tab === "timeline" && "Audit Timeline"}
              {tab === "documents" && "Documents"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left main content columns */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "overview" && (
            <Card className="border border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-md font-extrabold flex items-center gap-2">
                  <Briefcase className="h-4.5 w-4.5 text-pastel-pink" />
                  <span>Job Description & Requirements</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Review JD definitions, experience constraints, and skill qualifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-foreground mb-1.5">Overview & Responsibilities</h4>
                  <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/20 p-4 rounded-2xl border border-border/40">
                    {job.description || job.jdText || "No detailed job description has been configured yet."}
                  </div>
                </div>

                {/* Requirements list */}
                {job.requirements && job.requirements.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-foreground mb-2">Detailed Requirements Checklist</h4>
                    <ul className="space-y-2">
                      {job.requirements.map((req: any, index: number) => (
                        <li key={index} className="flex gap-2 text-xs text-muted-foreground bg-muted/10 p-2.5 rounded-xl border border-border/20 items-start">
                          <span className={`inline-block h-1.5 w-1.5 rounded-full mt-1.5 ${req.isRequired ? "bg-pastel-pink" : "bg-pastel-blue"}`} />
                          <span className="leading-relaxed">
                            {req.description} {req.isRequired && <span className="text-[10px] font-bold text-pastel-pink-ink px-1 rounded bg-pastel-pink/20">Required</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Skills Tags */}
                {job.skills && job.skills.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-foreground mb-2 font-mono uppercase tracking-wider">Required Skills Set</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.map((skill: any, idx: number) => (
                        <span
                          key={idx}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                            skill.isRequired
                              ? "bg-pastel-pink/20 text-pastel-pink-ink border-pink-200/10"
                              : "bg-pastel-blue/20 text-pastel-blue-ink border-blue-200/10"
                          }`}
                        >
                          {skill.name} {skill.isRequired && "★"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "team" && (
            <Card className="border border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-md font-extrabold flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-pastel-pink" />
                  <span>Assigned Hiring Team</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Recruiters and hiring managers assigned to drive pipeline outcomes for this opening.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recruiters */}
                <div>
                  <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-pastel-blue" />
                    <span>Assigned Recruiters ({job.recruiters?.length || 0})</span>
                  </h4>
                  {job.recruiters && job.recruiters.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {job.recruiters.map((r: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl border border-border/30 bg-muted/10">
                          <div className="h-8 w-8 rounded-full bg-pastel-blue text-pastel-blue-ink text-[10px] font-extrabold flex items-center justify-center">
                            {r.user?.name ? r.user.name.substring(0, 2).toUpperCase() : "RC"}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{r.user?.name || "Unresolved User"}</span>
                            <span className="text-[10px] text-muted-foreground">{r.user?.email || ""}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic bg-muted/10 p-4 rounded-2xl border border-border/20">
                      No recruiters have been formally assigned to this job posting.
                    </p>
                  )}
                </div>

                {/* Hiring Managers */}
                <div>
                  <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-pastel-yellow" />
                    <span>Hiring Managers ({job.hiringManagers?.length || 0})</span>
                  </h4>
                  {job.hiringManagers && job.hiringManagers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {job.hiringManagers.map((hm: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl border border-border/30 bg-muted/10">
                          <div className="h-8 w-8 rounded-full bg-pastel-yellow text-pastel-yellow-ink text-[10px] font-extrabold flex items-center justify-center">
                            {hm.user?.name ? hm.user.name.substring(0, 2).toUpperCase() : "HM"}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{hm.user?.name || "Unresolved User"}</span>
                            <span className="text-[10px] text-muted-foreground">{hm.user?.email || ""}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic bg-muted/10 p-4 rounded-2xl border border-border/20">
                      No hiring managers have been assigned to review applicants.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "timeline" && (
            <Card className="border border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-md font-extrabold flex items-center gap-2">
                  <History className="h-4.5 w-4.5 text-pastel-pink" />
                  <span>Audit Trail & Workflow History</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Full status history and transition log from creation to fulfillment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {job.statusHistory && job.statusHistory.length > 0 ? (
                  <div className="relative border-l border-border/60 ml-3.5 pl-5 space-y-6">
                    {job.statusHistory.map((hist: any, idx: number) => (
                      <div key={idx} className="relative">
                        {/* Bullet */}
                        <div className="absolute -left-[26px] top-1 h-3 w-3 rounded-full bg-background border border-primary flex items-center justify-center">
                          <div className="h-1 w-1 rounded-full bg-primary" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">
                              Changed status to <span className="font-extrabold text-primary">{hist.newStatus}</span>
                            </span>
                            {hist.oldStatus && (
                              <span className="text-[9px] text-muted-foreground font-semibold">
                                (from {hist.oldStatus})
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground font-semibold ml-auto">
                              {new Date(hist.changedAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                          {hist.reason && (
                            <p className="text-xs text-muted-foreground italic mt-0.5">
                              "{hist.reason}"
                            </p>
                          )}
                          <span className="text-[9px] text-muted-foreground">
                            Triggered by {hist.changedBy?.name || "System Automated Broker"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-muted/10 p-4 rounded-2xl border border-border/20">
                    No workflow transitions recorded yet. Status remains at {job.status.replace("_", " ")}.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "documents" && (
            <Card className="border border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-md font-extrabold flex items-center gap-2">
                  <FolderOpen className="h-4.5 w-4.5 text-pastel-pink" />
                  <span>Job Attachments & JD Docs</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Review PDF briefs, legal NDA requirements, and external career descriptions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {job.documents && job.documents.length > 0 ? (
                  <div className="space-y-2.5">
                    {job.documents.map((doc: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-border/30 bg-muted/10 hover:bg-muted/20 transition-all">
                        <div className="flex items-center gap-2.5">
                          <FileText className="h-4 w-4 text-pastel-pink-ink bg-pastel-pink/20 p-1 rounded" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{doc.name}</span>
                            <span className="text-[9px] text-muted-foreground font-mono">
                              Type: {doc.documentType} {doc.fileSize ? `• ${(doc.fileSize / 1024).toFixed(1)} KB` : ""}
                            </span>
                          </div>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-xl transition-all"
                        >
                          View Document
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-muted/10 p-4 rounded-2xl border border-border/20">
                    No documents uploaded. Attach files using the Edit modal parameters.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right side metadata info panel */}
        <div className="space-y-6">
          <Card className="border border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/30">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Info className="h-4 w-4 text-pastel-blue-ink" />
                <span>Job Meta Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/20 px-5 text-xs py-2">
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground font-medium">Salary Bracket</span>
                <span className="font-bold text-foreground">
                  {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground font-medium">Exp Requirement</span>
                <span className="font-bold text-foreground">
                  {formatExperience(job.minExperience, job.maxExperience)}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground font-medium">Openings Count</span>
                <span className="font-bold text-foreground">{job.openingsCount || 1} position(s)</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground font-medium">Deadline</span>
                <span className="font-bold text-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    {job.deadline
                      ? new Date(job.deadline).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })
                      : "Open-ended"}
                  </span>
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground font-medium">Department</span>
                <span className="font-bold text-foreground uppercase">
                  {job.departments?.map((d: any) => d.name).join(", ") || "General Engineering"}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground font-medium">Creation Date</span>
                <span className="font-semibold text-muted-foreground">
                  {new Date(job.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Editing Dialog Modal */}
      <Dialog isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modify Job Opening Parameters">
        <JobForm onSubmit={handleEditSubmit} initialValues={job} isLoading={updateMutation.isPending} />
      </Dialog>
    </div>
  );
}
