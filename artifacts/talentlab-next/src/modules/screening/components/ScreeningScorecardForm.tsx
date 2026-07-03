import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitScorecard } from "../hooks/useSubmitScorecard";
import { useToast } from "@/providers/ToastProvider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sparkles, Trophy, CheckCircle, HelpCircle, XCircle } from "lucide-react";

const scoreRange = z.coerce.number().min(1, "Score must be at least 1").max(10, "Score cannot exceed 10");

const scorecardFormSchema = z.object({
  communicationScore: scoreRange,
  technicalScore: scoreRange,
  experienceScore: scoreRange,
  salaryAlignScore: scoreRange,
  noticePeriodScore: scoreRange,
  personalityScore: scoreRange,
  
  verdict: z.enum(["SHORTLIST", "HOLD", "REJECT"]),
  recommendation: z.string().min(10, "Please provide at least 10 characters of recommendation/justification"),
  notes: z.string().optional(),
  
  currentCtcDisclosed: z.coerce.number().min(0).optional(),
  expectedCtcDisclosed: z.coerce.number().min(0).optional(),
  noticePeriodDays: z.coerce.number().int().min(0).optional(),
  canJoinEarlier: z.boolean().default(false),
});

type ScorecardFormValues = z.infer<typeof scorecardFormSchema>;

interface ScreeningScorecardFormProps {
  screeningId: string;
  onSuccess: () => void;
}

export function ScreeningScorecardForm({
  screeningId,
  onSuccess,
}: ScreeningScorecardFormProps) {
  const { toast } = useToast();
  const submitMutation = useSubmitScorecard();
  const [avgScore, setAvgScore] = useState<number>(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ScorecardFormValues>({
    resolver: zodResolver(scorecardFormSchema),
    defaultValues: {
      communicationScore: 5,
      technicalScore: 5,
      experienceScore: 5,
      salaryAlignScore: 5,
      noticePeriodScore: 5,
      personalityScore: 5,
      verdict: "HOLD",
      recommendation: "",
      notes: "",
      currentCtcDisclosed: undefined,
      expectedCtcDisclosed: undefined,
      noticePeriodDays: undefined,
      canJoinEarlier: false,
    },
  });

  // Watch all scores to compute a live average score
  const comScore = watch("communicationScore");
  const techScore = watch("technicalScore");
  const expScore = watch("experienceScore");
  const salScore = watch("salaryAlignScore");
  const noticeScore = watch("noticePeriodScore");
  const persScore = watch("personalityScore");

  useEffect(() => {
    const scores = [
      Number(comScore),
      Number(techScore),
      Number(expScore),
      Number(salScore),
      Number(noticeScore),
      Number(persScore),
    ].filter((s) => !isNaN(s));

    if (scores.length > 0) {
      const avg = scores.reduce((sum, curr) => sum + curr, 0) / scores.length;
      setAvgScore(Math.round(avg * 10) / 10);
    } else {
      setAvgScore(0);
    }
  }, [comScore, techScore, expScore, salScore, noticeScore, persScore]);

  const onSubmit = async (values: ScorecardFormValues) => {
    try {
      const payload = {
        scorecard: {
          communicationScore: Number(values.communicationScore),
          technicalScore: Number(values.technicalScore),
          experienceScore: Number(values.experienceScore),
          salaryAlignScore: Number(values.salaryAlignScore),
          noticePeriodScore: Number(values.noticePeriodScore),
          personalityScore: Number(values.personalityScore),
        },
        verdict: values.verdict,
        recommendation: values.recommendation,
        notes: values.notes,
        currentCtcDisclosed: values.currentCtcDisclosed ? Number(values.currentCtcDisclosed) : undefined,
        expectedCtcDisclosed: values.expectedCtcDisclosed ? Number(values.expectedCtcDisclosed) : undefined,
        noticePeriodDays: values.noticePeriodDays ? Number(values.noticePeriodDays) : undefined,
        canJoinEarlier: values.canJoinEarlier,
      };

      await submitMutation.mutateAsync({
        id: screeningId,
        data: payload,
      });

      toast(`Scorecard submitted! Candidate marked as ${values.verdict}`, "success");
      onSuccess();
    } catch (err: any) {
      toast(err.message || "Failed to submit scorecard.", "error");
    }
  };

  const verdictOptions = [
    { value: "SHORTLIST", label: "SHORTLIST (Move candidate to Assessed stage)" },
    { value: "HOLD", label: "HOLD (Keep in current stage)" },
    { value: "REJECT", label: "REJECT (Move candidate to Rejected stage)" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Average Score Indicator */}
      <div className="bg-foreground text-background p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm border border-foreground/10">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-background/85 flex items-center gap-1.5">
            <Trophy className="h-4.5 w-4.5 text-pastel-yellow" />
            <span>Scorecard Evaluation Gauge</span>
          </h3>
          <p className="text-[10px] text-background/65 mt-0.5 max-w-md">
            Values are averaged out of 10. Submission automatically logs evaluation records and affects the pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-black">{avgScore} / 10</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-background/25 uppercase">
            {avgScore >= 8 ? "Excellent" : avgScore >= 6 ? "Good" : avgScore >= 4 ? "Average" : "Needs Review"}
          </span>
        </div>
      </div>

      {/* Evaluation Scores Section */}
      <div className="bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl space-y-4">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2">
          Dimension Ratings (1 - 10)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { name: "communicationScore", label: "Communication Skills" },
            { name: "technicalScore", label: "Technical Competence" },
            { name: "experienceScore", label: "Relevant Experience" },
            { name: "salaryAlignScore", label: "Salary Alignment" },
            { name: "noticePeriodScore", label: "Notice Period Fit" },
            { name: "personalityScore", label: "Culture & Personality" },
          ].map((item) => (
            <div key={item.name} className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {item.label} *
              </label>
              <Input
                type="number"
                min={1}
                max={10}
                placeholder="1 to 10"
                {...register(item.name as any)}
                className="h-11 rounded-2xl border-border/70"
              />
              {errors[item.name as keyof ScorecardFormValues] && (
                <p className="text-[10px] text-destructive font-medium">
                  {errors[item.name as keyof ScorecardFormValues]?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Compensation & Disclosures */}
      <div className="bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl space-y-4">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2">
          Compensation & Notice Period Disclosures
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current CTC (INR / Annum)</label>
            <Input
              type="number"
              placeholder="e.g. 800000"
              {...register("currentCtcDisclosed")}
              className="h-11 rounded-2xl border-border/70"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Expected CTC (INR / Annum)</label>
            <Input
              type="number"
              placeholder="e.g. 1200000"
              {...register("expectedCtcDisclosed")}
              className="h-11 rounded-2xl border-border/70"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notice Period (Days)</label>
            <Input
              type="number"
              placeholder="e.g. 30"
              {...register("noticePeriodDays")}
              className="h-11 rounded-2xl border-border/70"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="canJoinEarlier"
            {...register("canJoinEarlier")}
            className="h-4.5 w-4.5 rounded-lg border-border text-primary focus:ring-primary/40 bg-card cursor-pointer"
          />
          <label htmlFor="canJoinEarlier" className="text-xs font-semibold text-muted-foreground cursor-pointer select-none">
            Candidate confirmed they can join earlier (Buyout option / Negotiable)
          </label>
        </div>
      </div>

      {/* Decision Section */}
      <div className="bg-card/45 backdrop-blur-md border border-border/80 p-5 rounded-2xl space-y-4">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2">
          Final Verdict & Review
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Verdict selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Verdict *</label>
            <Select
              options={verdictOptions}
              {...register("verdict")}
            />
            {errors.verdict && (
              <p className="text-[10px] text-destructive font-medium">{errors.verdict.message}</p>
            )}
          </div>
        </div>

        {/* Written Recommendation */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Written Recommendation / Justification *
          </label>
          <textarea
            rows={4}
            placeholder="Outline candidate's strengths, potential gaps, alignment with the role, and reasons for verdict decision..."
            {...register("recommendation")}
            className="flex min-h-[100px] w-full rounded-2xl border border-input bg-card px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
          />
          {errors.recommendation && (
            <p className="text-[10px] text-destructive font-medium">{errors.recommendation.message}</p>
          )}
        </div>

        {/* General Internal Notes */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Additional Internal Feedback</label>
          <textarea
            rows={2}
            placeholder="Any extra observations, logistical details, client expectations fit..."
            {...register("notes")}
            className="flex min-h-[60px] w-full rounded-2xl border border-input bg-card px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
          />
        </div>
      </div>

      {/* Form Submission Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-border/20 pt-4 mt-2">
        <Button
          type="submit"
          disabled={submitMutation.isPending}
          className="rounded-xl px-5 text-xs h-11 cursor-pointer flex items-center gap-1.5 shadow"
        >
          <Sparkles className="h-4 w-4 text-pastel-yellow" />
          <span>{submitMutation.isPending ? "Submitting Scorecard..." : "Submit Scorecard & Decision"}</span>
        </Button>
      </div>
    </form>
  );
}
