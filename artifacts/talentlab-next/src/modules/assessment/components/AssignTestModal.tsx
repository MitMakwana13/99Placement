import React, { useState, useEffect } from "react";
import { useAssessmentTemplates } from "@/modules/assessment/hooks/useAssessmentTemplates";
import { useAssignTest } from "@/modules/assessment/hooks/useAssessmentTests";
import { pipelineService } from "@/services/pipeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/providers/ToastProvider";

interface AssignTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineId?: string;
  onSuccess?: () => void;
}

export function AssignTestModal({ isOpen, onClose, pipelineId: initialPipelineId, onSuccess }: AssignTestModalProps) {
  const { toast } = useToast();
  const assignMutation = useAssignTest();
  const { data: templates } = useAssessmentTemplates();

  const [pipelineId, setPipelineId] = useState(initialPipelineId || "");
  const [templateId, setTemplateId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  
  // Pipeline items state for dropdown (if no pipelineId was pre-passed)
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [loadingPipelines, setLoadingPipelines] = useState(false);

  useEffect(() => {
    if (initialPipelineId) {
      setPipelineId(initialPipelineId);
    } else if (isOpen) {
      // Load active pipelines in stage "ASSESSED" or "SHORTLISTED"
      setLoadingPipelines(true);
      pipelineService.list({ stage: "ASSESSED" })
        .then((res) => {
          setPipelines(res.items || []);
        })
        .catch((err) => {
          console.error("Failed to load assessed pipelines", err);
        })
        .finally(() => {
          setLoadingPipelines(false);
        });
    }
  }, [isOpen, initialPipelineId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipelineId) {
      toast("Please select a candidate assignment", "error");
      return;
    }
    if (!templateId) {
      toast("Please select an assessment template", "error");
      return;
    }

    try {
      await assignMutation.mutateAsync({
        pipelineId,
        templateId,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      toast("Assessment assigned successfully", "success");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast(err.message || "Failed to assign assessment", "error");
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Assessment Test"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Candidate Selection (if not pre-locked) */}
        {!initialPipelineId ? (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Candidate Stage Assignment (ASSESSED stage) *
            </label>
            {loadingPipelines ? (
              <div className="text-xs text-muted-foreground">Loading active candidates...</div>
            ) : (
              <Select
                value={pipelineId}
                onChange={(e) => setPipelineId(e.target.value)}
                options={[
                  { value: "", label: "Select Candidate & Job..." },
                  ...pipelines.map((p) => ({
                    value: p.id,
                    label: `${p.candidate?.name || "Unknown Candidate"} — ${p.job?.title || "Unknown Job"}`,
                  })),
                ]}
                required
              />
            )}
          </div>
        ) : null}

        {/* Template selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Assessment Template *
          </label>
          <Select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            options={[
              { value: "", label: "Select Template..." },
              ...(templates || []).map((t) => ({
                value: t.id,
                label: `${t.name} (${t.durationMinutes} mins | pass: ${t.passPercentage}%)`,
              })),
            ]}
            required
          />
        </div>

        {/* Schedule date */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Scheduled At
          </label>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="h-10 rounded-xl"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Leave blank to schedule immediately.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-border/20 pt-4 mt-2">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-4 text-xs h-10">
            Cancel
          </Button>
          <Button type="submit" disabled={assignMutation.isPending} className="rounded-xl px-4 text-xs h-10">
            {assignMutation.isPending ? "Assigning..." : "Assign Assessment"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
