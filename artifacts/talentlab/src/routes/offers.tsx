import { FileText, Check, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useLocation } from "wouter";

import { PageHeader, tone } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useListOffers,
  useCreateOffer,
  useUpdateOfferStatus,
  useGetKanbanPipeline,
  getListOffersQueryKey,
} from "@workspace/api-client-react";
import type { OfferWithCandidate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

// Values must match OfferWithCandidateStatus from generated types
type OfferStatus = "drafted" | "sent" | "accepted" | "rejected" | "revoked";

const STATUS_FLOW: OfferStatus[] = ["drafted", "sent", "accepted"];
const STATUS_LABELS: Record<string, string> = {
  drafted: "Drafted",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  revoked: "Revoked",
};
const STATUS_TONE: Record<string, string> = {
  drafted: "pastel-yellow",
  sent: "pastel-blue",
  accepted: "pastel-green",
  rejected: "pastel-pink",
  revoked: "pastel-lavender",
};
const DOCS = ["Offer letter", "PAN copy", "Aadhaar", "Bank details", "Past payslips"];

function Bar({ label, value, max, accent }: { label: string; value: number; max: number; accent: string }) {
  const pct = value ? (value / max) * 100 : 0;
  return (
    <div className="grid grid-cols-[80px_1fr_70px] items-center gap-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="h-7 rounded-full bg-muted/60">
        {pct > 0 && (
          <div
            className={`flex h-full items-center justify-end rounded-full px-2 text-[11px] font-semibold ${tone(accent)}`}
            style={{ width: `${Math.max(pct, 10)}%` }}
          >
            ₹{(value / 100000).toFixed(1)}L
          </div>
        )}
      </div>
      <span className="text-right text-xs tabular-nums">
        {value ? `₹${(value / 100000).toFixed(1)}L` : "—"}
      </span>
    </div>
  );
}

export function OffersPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: offers = [], isLoading } = useListOffers({ limit: 50 });
  const { data: pipeline } = useGetKanbanPipeline({});
  const createOffer = useCreateOffer();
  const updateStatus = useUpdateOfferStatus();

  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ pipelineId: "", offeredCtc: "", designation: "", joiningDate: "" });

  // Entries eligible for offer (in client_interview, shortlisted)
  const eligibleEntries = [
    ...(pipeline?.shortlisted ?? []),
    ...(pipeline?.client_interview ?? []),
  ] as Array<{ id: string; candidate?: { name: string } | null }>;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pipelineId) { toast.error("Select a pipeline entry"); return; }
    createOffer.mutate(
      {
        data: {
          pipelineId: form.pipelineId,
          offeredCtc: form.offeredCtc ? Number(form.offeredCtc) * 100000 : undefined,
          designation: form.designation || undefined,
          joiningDate: form.joiningDate || undefined,
        },
      },
      {
        onSuccess() {
          queryClient.invalidateQueries({ queryKey: getListOffersQueryKey() });
          setIsAdding(false);
          setForm({ pipelineId: "", offeredCtc: "", designation: "", joiningDate: "" });
          toast.success("Offer created");
        },
        onError(err: any) { toast.error(err?.data?.error ?? "Failed to create offer"); },
      }
    );
  }

  function handleStatusChange(id: string, status: string) {
    updateStatus.mutate(
      { id, data: { status: status as any } },
      {
        onSuccess() {
          queryClient.invalidateQueries({ queryKey: getListOffersQueryKey() });
          toast.success(`Offer marked as ${STATUS_LABELS[status] ?? status}`);
        },
        onError(err: any) { toast.error(err?.data?.error ?? "Failed to update offer status"); },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offers & Salary"
        subtitle="CTC comparison, offer status tracking, and document collection."
        actions={
          <Button
            className="rounded-full bg-[var(--ink)] text-background"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> New Offer
          </Button>
        }
      />

      {offers.length === 0 ? (
        <div className="card-pastel bg-card py-12 text-center text-muted-foreground">
          <p className="mb-4">No offers yet.</p>
          <Button onClick={() => setIsAdding(true)} className="rounded-full bg-[var(--ink)] text-background">
            <Plus className="mr-2 h-4 w-4" /> Create first offer
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="negotiation" className="space-y-6">
          <TabsList className="bg-muted/50 rounded-2xl p-1">
            <TabsTrigger value="negotiation" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Salary Negotiation
            </TabsTrigger>
            <TabsTrigger value="management" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Offer Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="negotiation" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {offers.map((o: OfferWithCandidate) => {
                const offered = o.offeredCtc ?? 0;
                const expected = o.candidate?.expectedCtc ?? 0;
                const maxVal = Math.max(offered, expected, 1);
                return (
                  <div key={o.id} className="card-pastel bg-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-semibold">
                          {o.candidate?.name ?? "Unknown candidate"}
                        </div>
                        <div className="text-xs text-muted-foreground">{o.designation ?? "—"}</div>
                      </div>
                      <Badge className={`rounded-full ${tone(STATUS_TONE[o.status] ?? "pastel-yellow")}`}>
                        {STATUS_LABELS[o.status] ?? o.status}
                      </Badge>
                    </div>
                    <div className="mt-5 space-y-3">
                      <Bar label="Expected" value={expected} max={maxVal} accent="pastel-yellow" />
                      <Bar label="Offered" value={offered} max={maxVal} accent="pastel-blue" />
                    </div>
                    <div className="mt-6 flex gap-2">
                      {o.status === "drafted" && (
                        <button
                          onClick={() => handleStatusChange(o.id, "sent")}
                          className="flex-1 rounded-xl bg-[var(--ink)] py-2 text-xs font-semibold text-background hover:opacity-90"
                        >
                          Send Offer
                        </button>
                      )}
                      {o.status === "sent" && (
                        <>
                          <button
                            onClick={() => handleStatusChange(o.id, "accepted")}
                            className="flex-1 rounded-xl bg-[var(--pastel-green)] py-2 text-xs font-semibold text-[var(--pastel-green-ink)] hover:opacity-90"
                          >
                            Mark Accepted
                          </button>
                          <button
                            onClick={() => handleStatusChange(o.id, "rejected")}
                            className="flex-1 rounded-xl bg-muted py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/80"
                          >
                            Mark Declined
                          </button>
                        </>
                      )}
                      {o.status === "accepted" && (
                        <button
                          onClick={() => setLocation("/joining")}
                          className="flex-1 rounded-xl bg-[var(--ink)] py-2 text-xs font-semibold text-background hover:opacity-90"
                        >
                          Start Documentation
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {offers.map((o: OfferWithCandidate) => {
                const stepIdx = STATUS_FLOW.indexOf(o.status as OfferStatus);
                const docsCollected = o.status === "accepted" ? 3 : 0;
                return (
                  <div key={`mgt-${o.id}`} className="card-pastel bg-[var(--pastel-blue)]/20">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-lg font-semibold">{o.candidate?.name ?? "—"}</div>
                        <div className="text-xs opacity-70">{o.designation ?? "—"}</div>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider opacity-60">Status flow</div>
                      <ol className="flex items-center">
                        {STATUS_FLOW.map((s, i) => (
                          <li key={s} className="flex flex-1 items-center">
                            <div
                              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${i <= stepIdx ? tone(STATUS_TONE[s]) : "bg-muted text-muted-foreground"}`}
                            >
                              {i < stepIdx ? <Check className="h-3.5 w-3.5" /> : i + 1}
                            </div>
                            {i < STATUS_FLOW.length - 1 && (
                              <div className={`mx-2 h-0.5 flex-1 ${i < stepIdx ? "bg-[var(--ink)]" : "bg-muted"}`} />
                            )}
                          </li>
                        ))}
                      </ol>
                      <div className="mt-1 flex justify-between text-[10px] opacity-70">
                        {STATUS_FLOW.map((s) => <span key={s}>{STATUS_LABELS[s]}</span>)}
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-card/60 p-3">
                      <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-60">
                        <span><FileText className="mr-1 inline h-3 w-3" /> Documents</span>
                        <span>{docsCollected}/{DOCS.length}</span>
                      </div>
                      <div className="space-y-1.5">
                        {DOCS.map((d, i) => (
                          <div key={d} className="flex items-center gap-2 text-xs">
                            <span
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${i < docsCollected ? "bg-[var(--pastel-green)] text-[var(--pastel-green-ink)]" : "bg-muted/50 text-muted-foreground"}`}
                            >
                              {i < docsCollected ? <Check className="h-3 w-3" /> : i + 1}
                            </span>
                            <span className={i < docsCollected ? "" : "opacity-60"}>{d}</span>
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
      )}

      {/* Create offer dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Offer</DialogTitle>
            <DialogDescription>Generate an offer for a shortlisted candidate.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Candidate (pipeline entry) *</label>
              <select
                required
                value={form.pipelineId}
                onChange={(e) => setForm((f) => ({ ...f, pipelineId: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select candidate…</option>
                {eligibleEntries.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.candidate?.name ?? e.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium">Offered CTC (LPA)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.offeredCtc}
                  onChange={(e) => setForm((f) => ({ ...f, offeredCtc: e.target.value }))}
                  placeholder="24.5"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Designation</label>
                <Input
                  value={form.designation}
                  onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                  placeholder="Senior Engineer"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium">Joining Date</label>
                <Input
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) => setForm((f) => ({ ...f, joiningDate: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" disabled={createOffer.isPending} className="bg-[var(--ink)] text-background">
                {createOffer.isPending ? "Creating…" : "Create Offer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
