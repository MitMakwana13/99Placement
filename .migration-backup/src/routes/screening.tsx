import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";

import { PageHeader, tone } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { candidates, screeningCriteria } from "@/lib/mock-data";

export const Route = createFileRoute("/screening")({
  head: () => ({ meta: [{ title: "Screening · talentlab" }, { name: "description", content: "Structured screening scorecard with 8 criteria." }] }),
  component: ScreeningPage,
});

function ScreeningPage() {
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [scores, setScores] = useState<number[]>(Array(screeningCriteria.length).fill(0));
  const [notes, setNotes] = useState<string[]>(Array(screeningCriteria.length).fill(""));
  const c = candidates[candidateIdx];

  const total = scores.reduce((a, b) => a + b, 0);
  const max = screeningCriteria.length * 5;
  const pct = Math.round((total / max) * 100);
  const verdict = pct >= 70 ? { label: "Shortlist", tone: "pastel-green" } : pct >= 50 ? { label: "Hold", tone: "pastel-yellow" } : { label: "Reject", tone: "pastel-pink" };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Screening interview"
        subtitle="Rate eight criteria. Total updates live and recommends a verdict."
        actions={<Button className="rounded-full bg-[var(--ink)] text-background">Save scorecard</Button>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <div className="card-pastel bg-card">
            <div className="flex items-center gap-3">
              <span className={`grid h-14 w-14 place-items-center rounded-2xl text-lg font-bold ${tone("pastel-pink")}`}>{c.initials}</span>
              <div>
                <div className="text-lg font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.role}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Info label="Experience" value={`${c.experience} yrs`} />
              <Info label="Notice" value={`${c.noticeDays}d`} />
              <Info label="Expected" value={`₹${c.expectedCtc} LPA`} />
              <Info label="Location" value={c.location} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{c.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.skills.map((s) => <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{s}</span>)}
            </div>
          </div>

          <div className="card-pastel bg-[var(--pastel-yellow)]">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--pastel-yellow-ink)]/80">Pick another candidate</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {candidates.slice(0, 6).map((cc, i) => (
                <button key={cc.id} onClick={() => { setCandidateIdx(i); setScores(Array(8).fill(0)); }} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${i === candidateIdx ? "bg-[var(--ink)] text-background" : "bg-card"}`}>{cc.initials}</button>
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
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tone(verdict.tone)}`}>{verdict.label}</span>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {screeningCriteria.map((label, i) => (
              <div key={label} className="grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr_1fr] md:items-center">
                <div className="text-sm font-medium">{label}</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setScores((s) => s.map((v, j) => (j === i ? n : v)))} aria-label={`${label} ${n}`}>
                      <Star className={`h-6 w-6 transition ${n <= scores[i] ? "fill-[var(--pastel-yellow)] text-[var(--pastel-yellow-ink)]" : "text-muted-foreground/40"}`} />
                    </button>
                  ))}
                </div>
                <Textarea
                  rows={1}
                  placeholder="Notes…"
                  value={notes[i]}
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
