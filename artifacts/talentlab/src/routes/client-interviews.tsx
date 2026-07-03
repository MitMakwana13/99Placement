import { useState } from "react";
import { CalendarDays, Share2, Check, X, RotateCcw, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, tone } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  useListClientInterviews,
  useCreateClientInterview,
  useSubmitClientInterviewFeedback,
  useGetKanbanPipeline,
  getListClientInterviewsQueryKey,
} from "@workspace/api-client-react";
import type { ClientInterviewWithCandidate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

// Values must match ClientInterviewFeedbackRequestVerdict from generated types
type Verdict = "selected" | "on_hold" | "rejected" | "no_show";
const VERDICT_LABELS: Record<Verdict, string> = {
  selected: "Selected",
  on_hold: "Hold",
  rejected: "Rejected",
  no_show: "No show",
};
const VERDICT_TONE: Record<Verdict, string> = {
  selected: "pastel-green",
  on_hold: "pastel-yellow",
  rejected: "pastel-pink",
  no_show: "pastel-blue",
};

export function ClientInterviewsPage() {
  const queryClient = useQueryClient();
  const { data: interviews = [], isLoading } = useListClientInterviews({ limit: 50 });
  const { data: pipeline } = useGetKanbanPipeline({});
  const createInterview = useCreateClientInterview();
  const submitFeedback = useSubmitClientInterviewFeedback();

  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ pipelineId: "", scheduledAt: "", mode: "video", round: "1" });
  const [feedbackNotes, setFeedbackNotes] = useState<Record<string, string>>({});
  const [pendingVerdicts, setPendingVerdicts] = useState<Record<string, Verdict>>({});

  // Eligible candidates for client interview
  const eligibleEntries = [
    ...(pipeline?.shortlisted ?? []),
    ...(pipeline?.client_interview ?? []),
  ] as Array<{ id: string; candidate?: { name: string } | null }>;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pipelineId || !form.scheduledAt) { toast.error("Pipeline entry and time required"); return; }
    createInterview.mutate(
      {
        data: {
          pipelineId: form.pipelineId,
          scheduledAt: form.scheduledAt,
          mode: form.mode as any,
          round: form.round,
        },
      },
      {
        onSuccess() {
          queryClient.invalidateQueries({ queryKey: getListClientInterviewsQueryKey() });
          setIsAdding(false);
          setForm({ pipelineId: "", scheduledAt: "", mode: "video", round: "1" });
          toast.success("Interview scheduled");
        },
        onError(err: any) { toast.error(err?.data?.error ?? "Failed to schedule interview"); },
      }
    );
  }

  function handleFeedbackSubmit(interview: ClientInterviewWithCandidate) {
    const verdict = pendingVerdicts[interview.id];
    if (!verdict) { toast.error("Select a verdict first"); return; }
    submitFeedback.mutate(
      {
        id: interview.id,
        data: {
          verdict,
          feedbackRecruiter: feedbackNotes[interview.id] || undefined,
        },
      },
      {
        onSuccess() {
          queryClient.invalidateQueries({ queryKey: getListClientInterviewsQueryKey() });
          toast.success("Feedback submitted");
        },
        onError(err: any) { toast.error(err?.data?.error ?? "Failed to submit feedback"); },
      }
    );
  }

  // Group interviews by scheduled date for the calendar view
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
  const weekSlots = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dayInterviews = interviews.filter((iv) => {
      const sd = new Date(iv.scheduledAt);
      return sd.toDateString() === d.toDateString();
    });
    return { day: d.toLocaleDateString("en", { weekday: "short" }), date: d.getDate(), items: dayInterviews };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Shortlist for showcase — candidates in client_interview stage
  const shortlistEntries = (pipeline?.client_interview ?? []) as Array<{
    id: string;
    candidate?: { name: string; initials?: string | null; currentRole?: string | null; experienceYears?: number | null; location?: string | null; source: string } | null;
  }>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Interviews & Feedback"
        subtitle="Coordinate interviews and capture post-interview feedback."
        actions={
          <Button className="rounded-full bg-[var(--ink)] text-background" onClick={() => setIsAdding(true)}>
            <CalendarDays className="mr-2 h-4 w-4" /> New slot
          </Button>
        }
      />

      <Tabs defaultValue="coordination" className="space-y-6">
        <TabsList className="bg-muted/50 rounded-2xl p-1">
          <TabsTrigger value="coordination" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Client Interview Coordination
          </TabsTrigger>
          <TabsTrigger value="feedback" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Interview Feedback & Follow-Up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coordination" className="space-y-6">
          {/* Weekly calendar */}
          <div className="card-pastel bg-card">
            <h3 className="text-lg font-semibold">This week's schedule</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              {weekSlots.map((s) => (
                <div key={s.day} className="rounded-2xl bg-muted/40 p-3">
                  <div className="flex items-baseline justify-between">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">{s.day}</div>
                    <div className="text-2xl font-semibold tabular-nums">{s.date}</div>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {s.items.length === 0 && (
                      <div className="text-[11px] text-muted-foreground">Free</div>
                    )}
                    {s.items.map((iv) => {
                      const t = new Date(iv.scheduledAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
                      return (
                        <div key={iv.id} className={`rounded-xl p-2 text-[11px] ${tone("pastel-blue")}`}>
                          <div className="font-semibold">{t} · {iv.candidate?.name ?? "—"}</div>
                          <div className="opacity-70">Round {iv.round ?? "1"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shortlist showcase */}
          {shortlistEntries.length > 0 && (
            <div className="card-pastel bg-[var(--pastel-yellow)]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--pastel-yellow-ink)]">Shortlist showcase</h3>
                <Button size="sm" variant="outline" className="rounded-full">
                  <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share profiles
                </Button>
              </div>
              <p className="text-xs text-[var(--pastel-yellow-ink)]/70">
                Candidates in the client interview stage.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {shortlistEntries.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold ${tone("pastel-pink")}`}>
                      {e.candidate?.initials ?? e.candidate?.name.slice(0, 2).toUpperCase() ?? "??"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{e.candidate?.name ?? "—"}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {e.candidate?.currentRole ?? "—"}{e.candidate?.experienceYears != null ? ` · ${e.candidate.experienceYears}y` : ""}{e.candidate?.location ? ` · ${e.candidate.location}` : ""}
                      </div>
                    </div>
                    <Badge className="rounded-full bg-muted capitalize">{e.candidate?.source ?? "—"}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          {interviews.length === 0 ? (
            <div className="card-pastel bg-card py-12 text-center text-muted-foreground">
              No interviews scheduled yet. Use "New slot" to schedule one.
            </div>
          ) : (
            <div className="card-pastel bg-[var(--pastel-lavender)]">
              <h3 className="text-lg font-semibold">Feedback capture</h3>
              <p className="text-xs text-[var(--ink)]/70">
                Collect feedback from both client and candidate, and coordinate outcomes.
              </p>
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {interviews.map((iv: ClientInterviewWithCandidate) => {
                  const alreadyHasVerdict = !!iv.verdict;
                  return (
                    <div key={iv.id} className="rounded-2xl bg-card/60 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold">{iv.candidate?.name ?? "—"}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {new Date(iv.scheduledAt).toLocaleDateString()} · Round {iv.round ?? "1"}
                          </div>
                        </div>
                        {alreadyHasVerdict ? (
                          <Badge className={`rounded-full ${tone(VERDICT_TONE[iv.verdict as Verdict] ?? "pastel-blue")}`}>
                            {VERDICT_LABELS[iv.verdict as Verdict] ?? iv.verdict}
                          </Badge>
                        ) : (
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {(Object.keys(VERDICT_LABELS) as Verdict[]).map((v) => (
                              <button
                                key={v}
                                onClick={() => setPendingVerdicts((s) => ({ ...s, [iv.id]: v }))}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition ${pendingVerdicts[iv.id] === v ? tone(VERDICT_TONE[v]) + " ring-2 ring-[var(--ink)]/40" : "bg-card text-muted-foreground hover:bg-muted"}`}
                              >
                                {v === "selected" && <Check className="h-3 w-3" />}
                                {v === "rejected" && <X className="h-3 w-3" />}
                                {v === "no_show" && <RotateCcw className="h-3 w-3" />}
                                {VERDICT_LABELS[v]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {!alreadyHasVerdict && (
                        <>
                          <Textarea
                            rows={2}
                            placeholder="Client & candidate feedback notes..."
                            value={feedbackNotes[iv.id] ?? ""}
                            onChange={(e) => setFeedbackNotes((s) => ({ ...s, [iv.id]: e.target.value }))}
                            className="resize-none rounded-2xl border-transparent bg-background/50 focus-visible:ring-1 focus-visible:ring-[var(--ink)]"
                          />
                          {pendingVerdicts[iv.id] && (
                            <Button
                              size="sm"
                              className="mt-2 rounded-full bg-[var(--ink)] text-background"
                              onClick={() => handleFeedbackSubmit(iv)}
                              disabled={submitFeedback.isPending}
                            >
                              {submitFeedback.isPending ? "Submitting…" : "Submit Feedback"}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create interview dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>Book a client interview slot.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Candidate *</label>
              <select
                required
                value={form.pipelineId}
                onChange={(e) => setForm((f) => ({ ...f, pipelineId: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select candidate…</option>
                {eligibleEntries.map((e) => (
                  <option key={e.id} value={e.id}>{e.candidate?.name ?? e.id}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium">Date & Time *</label>
                <Input
                  type="datetime-local"
                  required
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Mode</label>
                <select
                  value={form.mode}
                  onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="video">Video</option>
                  <option value="in_person">In Person</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Round</label>
                <Input
                  value={form.round}
                  onChange={(e) => setForm((f) => ({ ...f, round: e.target.value }))}
                  placeholder="1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" disabled={createInterview.isPending} className="bg-[var(--ink)] text-background">
                {createInterview.isPending ? "Scheduling…" : "Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
