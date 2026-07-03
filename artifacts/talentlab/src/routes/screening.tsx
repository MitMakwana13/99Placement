import { useState } from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, tone } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useListCandidates,
  useGetKanbanPipeline,
  useCreateScreening,
  useSubmitScreening,
} from "@workspace/api-client-react";

const CRITERIA = [
  "Communication Skills",
  "Technical Knowledge",
  "Problem Solving",
  "Cultural Fit",
  "Leadership Potential",
  "Attitude & Motivation",
  "Domain Expertise",
  "Stability & Commitment",
];

export function ScreeningPage() {
  const { data: pipeline, isLoading: pipelineLoading } = useGetKanbanPipeline({});
  const createScreening = useCreateScreening();
  const submitScreening = useSubmitScreening();

  // Collect all pipeline entries that are in "sourced" stage (ready for screening)
  const sourcedEntries = (pipeline?.sourced ?? []) as Array<{ id: string; candidate?: { id: string; name: string; initials?: string | null; currentRole?: string | null; experienceYears?: number | null; noticeDays?: number | null; expectedCtc?: number | null; location?: string | null; summary?: string | null; skills?: string[] | null } | null }>;
  const allEntries = [
    ...(pipeline?.sourced ?? []),
    ...(pipeline?.screened ?? []),
  ] as typeof sourcedEntries;

  const [entryIdx, setEntryIdx] = useState(0);
  const [scores, setScores] = useState<number[]>(Array(CRITERIA.length).fill(0));
  const [notes, setNotes] = useState<string[]>(Array(CRITERIA.length).fill(""));
  const [submitted, setSubmitted] = useState(false);
  const [screeningId, setScreeningId] = useState<string | null>(null);

  const entry = allEntries[entryIdx];
  const c = entry?.candidate;

  const total = scores.reduce((a, b) => a + b, 0);
  const max = CRITERIA.length * 5;
  const pct = Math.round((total / max) * 100);
  const verdict = pct >= 70
    ? { label: "Shortlist", tone: "pastel-green", apiVerdict: "shortlist" }
    : pct >= 50
      ? { label: "Hold", tone: "pastel-yellow", apiVerdict: "hold" }
      : { label: "Reject", tone: "pastel-pink", apiVerdict: "reject" };

  async function handleSave() {
    if (!entry) return;
    createScreening.mutate(
      {
        data: {
          pipelineId: entry.id,
          interviewerId: "self",
          mode: "phone",
          criteriaScores: CRITERIA.map((criterion, i) => ({
            criterion,
            score: scores[i],
            notes: notes[i] || undefined,
          })),
        },
      },
      {
        onSuccess(data) {
          setScreeningId(data.id);
          toast.success("Scorecard saved");
        },
        onError(err: any) {
          toast.error(err?.data?.error ?? "Failed to save scorecard");
        },
      }
    );
  }

  async function handleSubmit() {
    if (!screeningId) { toast.error("Save scorecard first"); return; }
    submitScreening.mutate(
      {
        id: screeningId,
        data: { verdict: verdict.apiVerdict as any, overallScore: pct },
      },
      {
        onSuccess() {
          setSubmitted(true);
          toast.success(`Verdict submitted: ${verdict.label}`);
        },
        onError(err: any) {
          toast.error(err?.data?.error ?? "Failed to submit verdict");
        },
      }
    );
  }

  if (pipelineLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (allEntries.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Screening interview" subtitle="Rate criteria, get a verdict." />
        <div className="card-pastel bg-card py-12 text-center text-muted-foreground">
          No candidates in sourced or screened stages yet. Add candidates to requirements first.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Screening interview"
        subtitle="Rate eight criteria. Total updates live and recommends a verdict."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={handleSave}
              disabled={createScreening.isPending || submitted}
            >
              {createScreening.isPending ? "Saving…" : "Save scorecard"}
            </Button>
            {screeningId && !submitted && (
              <Button
                className="rounded-full bg-[var(--ink)] text-background"
                onClick={handleSubmit}
                disabled={submitScreening.isPending}
              >
                {submitScreening.isPending ? "Submitting…" : `Submit: ${verdict.label}`}
              </Button>
            )}
            {submitted && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${tone(verdict.tone)}`}>
                <CheckCircle2 className="h-4 w-4" /> Verdict submitted
              </span>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          {c && (
            <div className="card-pastel bg-card">
              <div className="flex items-center gap-3">
                <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-lg font-bold ${tone("pastel-pink")}`}>
                  {c.initials ?? c.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <div className="text-lg font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.currentRole ?? "—"}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Info label="Experience" value={c.experienceYears != null ? `${c.experienceYears} yrs` : "—"} />
                <Info label="Notice" value={c.noticeDays != null ? `${c.noticeDays}d` : "—"} />
                <Info label="Expected" value={c.expectedCtc != null ? `₹${(c.expectedCtc / 100000).toFixed(1)}L` : "—"} />
                <Info label="Location" value={c.location ?? "—"} />
              </div>
              {c.summary && <p className="mt-3 text-xs text-muted-foreground">{c.summary}</p>}
              {(c.skills ?? []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(c.skills ?? []).map((s) => (
                    <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="card-pastel bg-[var(--pastel-yellow)]">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--pastel-yellow-ink)]/80">
              Pick another candidate
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {allEntries.slice(0, 8).map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setEntryIdx(i);
                    setScores(Array(CRITERIA.length).fill(0));
                    setNotes(Array(CRITERIA.length).fill(""));
                    setSubmitted(false);
                    setScreeningId(null);
                  }}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${i === entryIdx ? "bg-[var(--ink)] text-background" : "bg-card hover:bg-card/80"}`}
                >
                  {e.candidate?.initials ?? e.candidate?.name.slice(0, 2).toUpperCase() ?? "??"}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="card-pastel bg-card">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Scorecard</h3>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Overall</div>
                <div className="text-3xl font-semibold tabular-nums">{pct}%</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tone(verdict.tone)}`}>
                {verdict.label}
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {CRITERIA.map((label, i) => (
              <div
                key={label}
                className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr_1fr] md:items-center"
              >
                <div className="text-sm font-medium">{label}</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setScores((s) => s.map((v, j) => (j === i ? n : v)))}
                      disabled={submitted}
                      aria-label={`${label} ${n}`}
                    >
                      <Star
                        className={`h-6 w-6 transition ${n <= scores[i] ? "fill-[var(--pastel-yellow)] text-[var(--pastel-yellow-ink)]" : "text-muted-foreground/40"}`}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  rows={1}
                  placeholder="Notes…"
                  value={notes[i]}
                  disabled={submitted}
                  onChange={(e) => setNotes((n) => n.map((v, j) => (j === i ? e.target.value : v)))}
                  className="resize-none rounded-2xl border-transparent bg-muted/50"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-2">
      <div className="text-[10px] font-bold uppercase text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
