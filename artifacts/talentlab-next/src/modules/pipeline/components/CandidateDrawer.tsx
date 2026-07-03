import React from "react";
import { PipelineItem } from "../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pipelineService } from "@/services/pipeline";
import { useToast } from "@/providers/ToastProvider";
import {
  X,
  User,
  Briefcase,
  Calendar,
  CheckSquare,
  History,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";

interface CandidateDrawerProps {
  item: PipelineItem | null;
  onClose: () => void;
}

export function CandidateDrawer({ item, onClose }: CandidateDrawerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutation for updating checklist items
  const toggleChecklistMutation = useMutation({
    mutationFn: ({ id, itemKey, isCompleted }: { id: string; itemKey: string; isCompleted: boolean }) =>
      pipelineService.updateChecklistItem(id, itemKey, isCompleted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      toast("Checklist updated successfully", "success");
    },
    onError: (err: any) => {
      toast(err.message || "Failed to update checklist item.", "error");
    },
  });

  if (!item) return null;

  const handleChecklistToggle = (itemKey: string, currentStatus: boolean) => {
    toggleChecklistMutation.mutate({
      id: item.id,
      itemKey,
      isCompleted: !currentStatus,
    });
  };

  // Format experience helper
  const expVal = item.candidate.experienceYears;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Background Overlay */}
      <div
        className="absolute inset-0 bg-ink/65 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        {/* Panel Container */}
        <div className="w-screen max-w-md bg-card border-l border-border/80 flex flex-col shadow-2xl relative animate-slide-in duration-300">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
            <h2 className="text-md font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <ClipboardList className="h-4.5 w-4.5 text-pastel-pink" />
              <span>Candidate Summary</span>
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-muted/60 text-muted-foreground hover:text-foreground cursor-pointer transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Contents */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            
            {/* Candidate Header Profile */}
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-pastel-pink text-pastel-pink-ink font-black text-sm flex items-center justify-center shrink-0">
                {item.candidate.initials || item.candidate.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-foreground tracking-tight leading-tight">
                  {item.candidate.name}
                </h3>
                <p className="text-xs text-muted-foreground font-semibold">
                  {item.candidate.currentRole || "Professional Talent"}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted border border-border/30 text-muted-foreground">
                    Exp: {expVal !== null ? `${expVal} yrs` : "N/A"}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted border border-border/30 text-muted-foreground capitalize">
                    {item.candidate.source?.toLowerCase().replace("_", " ") || "Direct"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Contacts */}
            <div className="space-y-2 text-xs text-muted-foreground border-t border-b border-border/40 py-4">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{item.candidate.email}</span>
              </div>
              {item.candidate.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{item.candidate.phone}</span>
                </div>
              )}
              {item.candidate.location && (
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{item.candidate.location}</span>
                </div>
              )}
            </div>

            {/* Job Details Card */}
            <div className="bg-muted/15 border border-border/60 rounded-2xl p-4 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-pastel-blue-ink" />
                <span>Job Openings Details</span>
              </h4>
              <div className="space-y-1">
                <p className="text-xs font-extrabold text-foreground">{item.job.title}</p>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  Code: {item.job.code || "N/A"} • Company: {item.job.company?.name || "Internal"}
                </p>
              </div>
              {item.assignedRecruiter && (
                <div className="border-t border-border/30 pt-2 flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                  <span>Assigned Recruiter:</span>
                  <span className="text-foreground font-bold">{item.assignedRecruiter.name}</span>
                </div>
              )}
            </div>

            {/* Checklist items */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CheckSquare className="h-4.5 w-4.5 text-pastel-pink" />
                <span>Pre-requisite Checklists</span>
              </h4>
              {item.checklists && item.checklists.length > 0 ? (
                <div className="space-y-2">
                  {item.checklists.map((chk) => (
                    <label
                      key={chk.id}
                      className="flex items-start gap-3 p-3 bg-muted/10 hover:bg-muted/20 border border-border/30 rounded-2xl cursor-pointer select-none transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={chk.isCompleted}
                        onChange={() => handleChecklistToggle(chk.itemKey, chk.isCompleted)}
                        disabled={toggleChecklistMutation.isPending}
                        className="h-4.5 w-4.5 rounded-lg border-border text-primary focus:ring-primary/40 bg-card cursor-pointer mt-0.5"
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-xs font-bold ${chk.isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {chk.title}
                        </span>
                        {chk.completedBy && (
                          <span className="text-[9px] text-muted-foreground">
                            Done by {chk.completedBy.name}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No checklist items registered.</p>
              )}
            </div>

            {/* Workflow transition timeline history */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <History className="h-4.5 w-4.5 text-pastel-pink" />
                <span>Transition History</span>
              </h4>
              {item.histories && item.histories.length > 0 ? (
                <div className="border-l border-border/50 ml-2.5 pl-4 space-y-4 text-xs">
                  {item.histories.map((hist) => (
                    <div key={hist.id} className="relative">
                      <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-background border border-primary" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-foreground">
                          {hist.newStage}
                        </p>
                        {hist.reason && (
                          <p className="text-muted-foreground text-[10px] italic">"{hist.reason}"</p>
                        )}
                        <p className="text-[9px] text-muted-foreground font-semibold">
                          {new Date(hist.changedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No transitions recorded.</p>
              )}
            </div>

          </div>

          {/* Footer action links */}
          <div className="px-6 py-4 border-t border-border/60 bg-muted/15 flex gap-2">
            <Link
              href={`/dashboard/candidates/${item.candidateId}`}
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-all cursor-pointer shadow-sm"
              onClick={onClose}
            >
              <ExternalLink className="h-4 w-4" />
              <span>Full Profile CRM</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
