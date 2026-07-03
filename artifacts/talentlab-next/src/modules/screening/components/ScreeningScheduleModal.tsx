import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usePipelines } from "@/modules/pipeline/hooks/usePipelines";
import { useScheduleScreening } from "../hooks/useScheduleScreening";
import { useToast } from "@/providers/ToastProvider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const scheduleScreeningSchema = z.object({
  pipelineId: z.string().min(1, "Candidate pipeline is required"),
  interviewerId: z.string().optional(),
  scheduledAt: z.string().refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d > new Date();
  }, { message: "Schedule date/time must be in the future" }),
  mode: z.enum(["phone", "video", "in_person"]),
  notes: z.string().optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleScreeningSchema>;

interface ScreeningScheduleModalProps {
  onSuccess: () => void;
  onCancel: () => void;
  preselectedPipelineId?: string;
}

export function ScreeningScheduleModal({
  onSuccess,
  onCancel,
  preselectedPipelineId,
}: ScreeningScheduleModalProps) {
  const { toast } = useToast();
  const { data: pipelinesData, isLoading: isLoadingPipelines } = usePipelines();
  const scheduleMutation = useScheduleScreening();

  const pipelines = pipelinesData?.items || [];
  // Valid stages for screening: SOURCED, SCREENED, ASSESSED
  const eligiblePipelines = pipelines.filter((p) =>
    ["SOURCED", "SCREENED", "ASSESSED"].includes(p.stage.toUpperCase())
  );

  // Extract unique interviewers from active pipelines
  const interviewers = Array.from(
    new Map(
      pipelines
        .filter((it) => it.assignedRecruiter)
        .map((it) => [it.assignedRecruiter!.id, it.assignedRecruiter!])
    ).values()
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleScreeningSchema),
    defaultValues: {
      pipelineId: preselectedPipelineId || "",
      interviewerId: "",
      scheduledAt: "",
      mode: "phone",
      notes: "",
    },
  });

  const onSubmit = async (values: ScheduleFormValues) => {
    try {
      await scheduleMutation.mutateAsync({
        pipelineId: values.pipelineId,
        interviewerId: values.interviewerId || undefined,
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        mode: values.mode,
      });
      toast("Screening interview scheduled successfully!", "success");
      onSuccess();
    } catch (err: any) {
      toast(err.message || "Failed to schedule screening.", "error");
    }
  };

  const pipelineOptions = [
    { value: "", label: "Select candidate..." },
    ...eligiblePipelines.map((p) => ({
      value: p.id,
      label: `${p.candidate.name} — ${p.job.title} (${p.stage})`,
    })),
  ];

  const interviewerOptions = [
    { value: "", label: "Select interviewer (defaults to current user)..." },
    ...interviewers.map((int) => ({
      value: int.id,
      label: int.name,
    })),
  ];

  const modeOptions = [
    { value: "phone", label: "Phone Call" },
    { value: "video", label: "Video Call (Google Meet/Teams)" },
    { value: "in_person", label: "In Person Interview" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Candidate Pipeline selection */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Candidate & Job *</label>
        <Select
          options={pipelineOptions}
          disabled={isLoadingPipelines || !!preselectedPipelineId}
          {...register("pipelineId")}
        />
        {errors.pipelineId && (
          <p className="text-[10px] text-destructive font-medium">{errors.pipelineId.message}</p>
        )}
      </div>

      {/* Interviewer select */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Interviewer</label>
        <Select
          options={interviewerOptions}
          disabled={isLoadingPipelines}
          {...register("interviewerId")}
        />
        {errors.interviewerId && (
          <p className="text-[10px] text-destructive font-medium">{errors.interviewerId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date and Time Picker */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date & Time *</label>
          <Input
            type="datetime-local"
            {...register("scheduledAt")}
            className="h-11 rounded-2xl border-border/70"
          />
          {errors.scheduledAt && (
            <p className="text-[10px] text-destructive font-medium">{errors.scheduledAt.message}</p>
          )}
        </div>

        {/* Meeting Mode */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Meeting Mode *</label>
          <Select
            options={modeOptions}
            {...register("mode")}
          />
          {errors.mode && (
            <p className="text-[10px] text-destructive font-medium">{errors.mode.message}</p>
          )}
        </div>
      </div>

      {/* Internal Instructions/Notes */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Instructions / Agenda</label>
        <textarea
          rows={3}
          placeholder="Enter prep notes, criteria instructions, link details..."
          {...register("notes")}
          className="flex min-h-[80px] w-full rounded-2xl border border-input bg-card px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
        />
        {errors.notes && (
          <p className="text-[10px] text-destructive font-medium">{errors.notes.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-border/20 pt-4 mt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-xl px-4 text-xs h-10 cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={scheduleMutation.isPending}
          className="rounded-xl px-4 text-xs h-10 cursor-pointer"
        >
          {scheduleMutation.isPending ? "Scheduling..." : "Schedule Screening"}
        </Button>
      </div>
    </form>
  );
}
