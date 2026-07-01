import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid, Rows3, MapPin, Clock, ChevronRight } from "lucide-react";

import { PageHeader, tone } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pipelineStages, requirements, type Requirement } from "@/lib/mock-data";

export const Route = createFileRoute("/requirements")({
  head: () => ({ meta: [{ title: "Requirements · talentlab" }, { name: "description", content: "All client requirements with stage progress." }] }),
  component: RequirementsPage,
});

const urgencyTone: Record<Requirement["urgency"], string> = {
  Critical: "pastel-pink",
  High: "pastel-yellow",
  Normal: "pastel-blue",
};

function RequirementsPage() {
  const [view, setView] = useState<"cards" | "table">("cards");
  const [open, setOpen] = useState<Requirement | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requirements"
        subtitle="Every open role across every client. Stage progress is live."
        actions={
          <div className="flex items-center gap-1 rounded-full bg-muted/60 p-1">
            <Button size="sm" variant={view === "cards" ? "default" : "ghost"} className="rounded-full" onClick={() => setView("cards")}>
              <LayoutGrid className="mr-1.5 h-4 w-4" /> Cards
            </Button>
            <Button size="sm" variant={view === "table" ? "default" : "ghost"} className="rounded-full" onClick={() => setView("table")}>
              <Rows3 className="mr-1.5 h-4 w-4" /> Table
            </Button>
          </div>
        }
      />

      {view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {requirements.map((r) => {
            const total = Object.values(r.stages).reduce((a, b) => a + b, 0);
            return (
              <button key={r.id} onClick={() => setOpen(r)} className="card-pastel bg-card text-left transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-12 w-12 place-items-center rounded-2xl text-lg font-bold ${tone("pastel-yellow")}`}>{r.initial}</span>
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{r.client} · {r.id}</div>
                      <div className="text-base font-semibold leading-tight">{r.role}</div>
                    </div>
                  </div>
                  <Badge className={`rounded-full ${tone(urgencyTone[r.urgency])}`}>{r.urgency}</Badge>
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {r.location}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {r.deadlineDays}d to close</span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Pipeline</span>
                    <span>{total} candidates</span>
                  </div>
                  <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-muted">
                    {pipelineStages.map((s) => {
                      const w = (r.stages[s.key] / total) * 100;
                      return <span key={s.key} style={{ width: `${w}%`, background: s.color }} />;
                    })}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pipelineStages.map((s) => (
                      <span key={s.key} className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px]">
                        <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.label} {r.stages[s.key]}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="font-semibold">{r.band}</span>
                  <span className="inline-flex items-center text-muted-foreground">Open detail <ChevronRight className="ml-0.5 h-3 w-3" /></span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="card-pastel bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Band</TableHead>
                <TableHead className="text-right">Pipeline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requirements.map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpen(r)}>
                  <TableCell><span className="font-medium">{r.client}</span><div className="text-xs text-muted-foreground">{r.id}</div></TableCell>
                  <TableCell>{r.role}</TableCell>
                  <TableCell className="text-muted-foreground">{r.location}</TableCell>
                  <TableCell><Badge className={`rounded-full ${tone(urgencyTone[r.urgency])}`}>{r.urgency}</Badge></TableCell>
                  <TableCell>{r.band}</TableCell>
                  <TableCell className="text-right">{Object.values(r.stages).reduce((a, b) => a + b, 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {open && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl text-lg font-bold ${tone("pastel-yellow")}`}>{open.initial}</span>
                  <div>
                    <SheetTitle className="text-xl">{open.role}</SheetTitle>
                    <SheetDescription>{open.client} · {open.location} · {open.band}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="card-pastel bg-muted/40">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job description</h4>
                  <p className="mt-2 text-sm leading-relaxed">{open.jd}</p>
                </div>
                <div>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Candidate kanban</h4>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {pipelineStages.map((s) => (
                      <div key={s.key} className="rounded-2xl p-3" style={{ background: s.color }}>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink)]/70">{s.label}</div>
                        <div className="mt-1 text-2xl font-semibold text-[var(--ink)]">{open.stages[s.key]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
