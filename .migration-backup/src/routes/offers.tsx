import { createFileRoute } from "@tanstack/react-router";
import { FileText, Check } from "lucide-react";

import { PageHeader, tone } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { offers } from "@/lib/mock-data";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/offers")({
  head: () => ({ meta: [{ title: "Offers & Salary · talentlab" }, { name: "description", content: "Salary negotiation, CTC comparison, offer status tracker, document checklist." }] }),
  component: OffersPage,
});

const statusFlow = ["Drafted", "Sent", "Accepted", "Documentation"] as const;
const statusTone: Record<(typeof statusFlow)[number], string> = {
  Drafted: "pastel-yellow",
  Sent: "pastel-blue",
  Accepted: "pastel-green",
  Documentation: "pastel-lavender",
};
const docs = ["Offer letter", "PAN copy", "Aadhaar", "Bank details", "Past payslips"];

function OffersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Offers & Salary" subtitle="Salary negotiation (CTC comparison), offer status tracking, and document collection." />

      <Tabs defaultValue="negotiation" className="space-y-6">
        <TabsList className="bg-muted/50 rounded-2xl p-1">
          <TabsTrigger value="negotiation" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">Salary Negotiation</TabsTrigger>
          <TabsTrigger value="management" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">Offer Management</TabsTrigger>
        </TabsList>

        <TabsContent value="negotiation" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {offers.map((o) => {
              const max = Math.max(o.expected, o.offered, o.final || o.offered);
              return (
                <div key={o.name} className="card-pastel bg-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-semibold">{o.name}</div>
                      <div className="text-xs text-muted-foreground">{o.role}</div>
                    </div>
                    <Badge className={`rounded-full ${tone(statusTone[o.status])}`}>{o.status}</Badge>
                  </div>

                  <div className="mt-5 space-y-3">
                    <Bar label="Expected" value={o.expected} max={max} accent="pastel-yellow" />
                    <Bar label="Offered" value={o.offered} max={max} accent="pastel-blue" />
                    <Bar label="Final Agreed" value={o.final || 0} max={max} accent="pastel-green" />
                  </div>
                  
                  <div className="mt-6 flex gap-2">
                     <button className="flex-1 rounded-xl bg-muted py-2 text-xs font-semibold hover:bg-muted/80">Revise Offer</button>
                     <button className="flex-1 rounded-xl bg-[var(--ink)] py-2 text-xs font-semibold text-background hover:opacity-90">Confirm Terms</button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {offers.map((o) => {
              const stepIdx = statusFlow.indexOf(o.status);
              return (
                <div key={`mgt-${o.name}`} className="card-pastel bg-[var(--pastel-peach)]/20">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-lg font-semibold">{o.name}</div>
                      <div className="text-xs opacity-70">{o.role}</div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider opacity-60">Status flow</div>
                    <ol className="flex items-center">
                      {statusFlow.map((s, i) => (
                        <li key={s} className="flex flex-1 items-center">
                          <div className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${i <= stepIdx ? tone(statusTone[s]) : "bg-muted text-muted-foreground"}`}>
                            {i < stepIdx ? <Check className="h-3.5 w-3.5" /> : i + 1}
                          </div>
                          {i < statusFlow.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${i < stepIdx ? "bg-[var(--ink)]" : "bg-muted"}`} />}
                        </li>
                      ))}
                    </ol>
                    <div className="mt-1 flex justify-between text-[10px] opacity-70">
                      {statusFlow.map((s) => <span key={s}>{s}</span>)}
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-card/60 p-3">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-60">
                      <span><FileText className="mr-1 inline h-3 w-3" /> Documents</span>
                      <span>{o.docs}/{o.totalDocs}</span>
                    </div>
                    <div className="space-y-1.5">
                      {docs.map((d, i) => (
                        <div key={d} className="flex items-center gap-2 text-xs">
                          <span className={`grid h-5 w-5 place-items-center rounded-full ${i < o.docs ? "bg-[var(--pastel-green)] text-[var(--pastel-green-ink)]" : "bg-muted/50 text-muted-foreground"}`}>
                            {i < o.docs ? <Check className="h-3 w-3" /> : i + 1}
                          </span>
                          <span className={i < o.docs ? "" : "opacity-60"}>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Bar({ label, value, max, accent }: { label: string; value: number; max: number; accent: string }) {
  const pct = value ? (value / max) * 100 : 0;
  return (
    <div className="grid grid-cols-[80px_1fr_60px] items-center gap-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="h-7 rounded-full bg-muted/60">
        <div className={`flex h-full items-center justify-end rounded-full px-2 text-[11px] font-semibold ${tone(accent)}`} style={{ width: `${pct}%` }}>
          {value ? `₹${value}L` : ""}
        </div>
      </div>
      <span className="text-right text-xs tabular-nums">{value ? `₹${value}L` : "—"}</span>
    </div>
  );
}
