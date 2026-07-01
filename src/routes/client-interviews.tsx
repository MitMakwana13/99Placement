import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Share2, Check, X, RotateCcw } from "lucide-react";

import { PageHeader, tone } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { candidates } from "@/lib/mock-data";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/client-interviews")({
  head: () => ({ meta: [{ title: "Client Interviews & Feedback · talentlab" }, { name: "description", content: "Schedule, shortlist showcase and post-interview feedback." }] }),
  component: ClientInterviewsPage,
});

const slots = [
  { day: "Mon", date: 30, items: [{ time: "10:00", who: "Priya Menon", client: "Globex" }] },
  { day: "Tue", date: 1, items: [{ time: "11:00", who: "Arjun Rao", client: "Acme" }, { time: "16:00", who: "Anita Desai", client: "Initech" }] },
  { day: "Wed", date: 2, items: [{ time: "14:00", who: "Mohammed Iqbal", client: "Stark" }] },
  { day: "Thu", date: 3, items: [] },
  { day: "Fri", date: 4, items: [{ time: "09:30", who: "Sara Kim", client: "Globex" }] },
];

type Outcome = "Selected" | "Hold" | "Rejected" | "Next round";
const outcomeTone: Record<Outcome, string> = {
  Selected: "pastel-green",
  Hold: "pastel-yellow",
  "Next round": "pastel-blue",
  Rejected: "pastel-pink",
};

function ClientInterviewsPage() {
  const shortlist = candidates.filter((c) => ["shortlisted", "client"].includes(c.stage)).slice(0, 4);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome | undefined>>({});

  return (
    <div className="space-y-6">
      <PageHeader title="Client Interviews & Feedback" subtitle="Coordinate interviews and capture post-interview feedback." actions={<Button className="rounded-full bg-[var(--ink)] text-background"><CalendarDays className="mr-2 h-4 w-4" /> New slot</Button>} />

      <Tabs defaultValue="coordination" className="space-y-6">
        <TabsList className="bg-muted/50 rounded-2xl p-1">
          <TabsTrigger value="coordination" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">Client Interview Coordination</TabsTrigger>
          <TabsTrigger value="feedback" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">Interview Feedback & Follow-Up</TabsTrigger>
        </TabsList>

        <TabsContent value="coordination" className="space-y-6">
          <div className="card-pastel bg-card">
            <h3 className="text-lg font-semibold">This week's schedule</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
              {slots.map((s) => (
                <div key={s.day} className="rounded-2xl bg-muted/40 p-3">
                  <div className="flex items-baseline justify-between">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">{s.day}</div>
                    <div className="text-2xl font-semibold tabular-nums">{s.date}</div>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {s.items.length === 0 && <div className="text-[11px] text-muted-foreground">Free</div>}
                    {s.items.map((it, i) => (
                      <div key={i} className={`rounded-xl p-2 text-[11px] ${tone("pastel-blue")}`}>
                        <div className="font-semibold">{it.time} · {it.who}</div>
                        <div className="opacity-70">{it.client}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-pastel bg-[var(--pastel-yellow)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--pastel-yellow-ink)]">Shortlist showcase</h3>
              <Button size="sm" variant="outline" className="rounded-full"><Share2 className="mr-1.5 h-3.5 w-3.5" /> Share profiles</Button>
            </div>
            <p className="text-xs text-[var(--pastel-yellow-ink)]/70">Clean public page for the client — branded, one card per candidate.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {shortlist.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl text-sm font-bold ${tone("pastel-pink")}`}>{c.initials}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{c.role} · {c.experience}y · {c.location}</div>
                  </div>
                  <Badge className="rounded-full bg-muted">{c.source}</Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <div className="card-pastel bg-[var(--pastel-lavender)]">
            <h3 className="text-lg font-semibold">Feedback capture</h3>
            <p className="text-xs text-[var(--ink)]/70">Collect feedback from both client and candidate, and coordinate outcomes.</p>
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {shortlist.map((c) => (
                <div key={c.id} className="rounded-2xl bg-card/60 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-semibold">{c.name}</div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {(["Selected", "Hold", "Next round", "Rejected"] as Outcome[]).map((o) => (
                        <button
                          key={o}
                          onClick={() => setOutcomes((s) => ({ ...s, [c.id]: o }))}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition ${outcomes[c.id] === o ? tone(outcomeTone[o]) + " ring-2 ring-[var(--ink)]/40" : "bg-card text-muted-foreground hover:bg-muted"}`}
                        >
                          {o === "Selected" && <Check className="h-3 w-3" />}
                          {o === "Rejected" && <X className="h-3 w-3" />}
                          {o === "Next round" && <RotateCcw className="h-3 w-3" />}
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea rows={3} placeholder="Client & candidate feedback notes..." className="resize-none rounded-2xl border-transparent bg-background/50 focus-visible:ring-1 focus-visible:ring-[var(--ink)]" />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
