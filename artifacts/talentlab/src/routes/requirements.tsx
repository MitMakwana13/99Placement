import { useState } from "react";
import { LayoutGrid, Rows3, MapPin, Clock, ChevronRight, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, tone } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  useListRequirements,
  useListCompanies,
  useCreateRequirement,
  getListRequirementsQueryKey,
} from "@workspace/api-client-react";
import type { RequirementWithCompany } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const urgencyTone: Record<string, string> = {
  critical: "pastel-pink",
  high: "pastel-yellow",
  normal: "pastel-blue",
};

const STAGE_COLORS = ["oklch(0.9 0.08 90)", "oklch(0.9 0.06 30)", "oklch(0.87 0.08 340)", "oklch(0.87 0.08 270)", "oklch(0.89 0.06 195)", "oklch(0.88 0.08 145)"];
const STAGE_KEYS = ["sourced", "screened", "assessed", "shortlisted", "client_interview", "offer"];

export function RequirementsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"cards" | "table">("cards");
  const [open, setOpen] = useState<RequirementWithCompany | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ companyId: "", title: "", location: "", urgency: "normal", salaryBand: "", openingsCount: "1", status: "open", jdText: "" });

  const { data: requirements = [], isLoading } = useListRequirements({ limit: 100 });
  const { data: companies = [] } = useListCompanies({ limit: 100 });
  const createMutation = useCreateRequirement();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.companyId || !form.title || !form.location) {
      toast.error("Company, title and location are required");
      return;
    }
    createMutation.mutate(
      {
        data: {
          companyId: form.companyId,
          title: form.title,
          location: form.location,
          urgency: form.urgency as any,
          salaryBand: form.salaryBand || undefined,
          openingsCount: Number(form.openingsCount) || 1,
          status: form.status as any,
          jdText: form.jdText || undefined,
        },
      },
      {
        onSuccess() {
          queryClient.invalidateQueries({ queryKey: getListRequirementsQueryKey() });
          setIsAdding(false);
          toast.success("Requirement created");
        },
        onError(err: any) {
          toast.error(err?.data?.error ?? "Failed to create requirement");
        },
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
        title="Requirements"
        subtitle={`${requirements.length} active requirements across ${new Set(requirements.map(r => r.companyId)).size} clients.`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-muted/60 p-1">
              <Button size="sm" variant={view === "cards" ? "default" : "ghost"} className="rounded-full" onClick={() => setView("cards")}>
                <LayoutGrid className="mr-1.5 h-4 w-4" /> Cards
              </Button>
              <Button size="sm" variant={view === "table" ? "default" : "ghost"} className="rounded-full" onClick={() => setView("table")}>
                <Rows3 className="mr-1.5 h-4 w-4" /> Table
              </Button>
            </div>
            <Button onClick={() => setIsAdding(true)} className="rounded-full bg-[var(--ink)] text-background">
              <Plus className="mr-2 h-4 w-4" /> New Requirement
            </Button>
          </div>
        }
      />

      {view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {requirements.map((r) => {
            const stageCounts = r.stageCounts ?? {};
            const total = Object.values(stageCounts).reduce((a, b) => a + (b as number), 0);
            const initial = (r.company?.name ?? r.title).slice(0, 2).toUpperCase();
            return (
              <button key={r.id} onClick={() => setOpen(r)} className="card-pastel bg-card text-left transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-bold ${tone("pastel-yellow")}`}>{initial}</span>
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{r.company?.name ?? "Client"}</div>
                      <div className="text-base font-semibold leading-tight">{r.title}</div>
                    </div>
                  </div>
                  <Badge className={`rounded-full shrink-0 ${tone(urgencyTone[r.urgency])}`}>
                    {r.urgency.charAt(0).toUpperCase() + r.urgency.slice(1)}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {r.location}</span>
                  {r.salaryBand && <span>{r.salaryBand}</span>}
                  <span>{r.openingsCount} opening{r.openingsCount !== 1 ? "s" : ""}</span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Pipeline</span>
                    <span>{total} candidates</span>
                  </div>
                  <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-muted">
                    {STAGE_KEYS.map((sk, i) => {
                      const cnt = (stageCounts[sk] as number) ?? 0;
                      if (total === 0 || cnt === 0) return null;
                      return <div key={sk} className="h-full" style={{ width: `${(cnt / total) * 100}%`, background: STAGE_COLORS[i] }} />;
                    })}
                    {total === 0 && <div className="h-full w-full rounded-full bg-muted-foreground/20" />}
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                    {STAGE_KEYS.slice(0, 3).map(sk => (
                      <span key={sk}>{sk.replace("_", " ")}: {(stageCounts[sk] as number) ?? 0}</span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
          {requirements.length === 0 && (
            <div className="col-span-3 py-12 text-center text-muted-foreground">
              <p className="mb-4">No requirements yet.</p>
              <Button onClick={() => setIsAdding(true)} className="rounded-full bg-[var(--ink)] text-background">
                <Plus className="mr-2 h-4 w-4" /> Create first requirement
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="card-pastel bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Openings</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {requirements.map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpen(r)}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{r.company?.name ?? "—"}</TableCell>
                  <TableCell>{r.location}</TableCell>
                  <TableCell>
                    <Badge className={`rounded-full ${tone(urgencyTone[r.urgency])}`}>
                      {r.urgency.charAt(0).toUpperCase() + r.urgency.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{r.status}</TableCell>
                  <TableCell>{r.openingsCount}</TableCell>
                  <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail sheet */}
      {open && (
        <Sheet open onOpenChange={() => setOpen(null)}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{open.title}</SheetTitle>
              <SheetDescription>{open.company?.name ?? "Client"} · {open.location}</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/50 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Urgency</div>
                  <div className="mt-1 font-semibold capitalize">{open.urgency}</div>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</div>
                  <div className="mt-1 font-semibold capitalize">{open.status}</div>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Openings</div>
                  <div className="mt-1 font-semibold">{open.openingsCount}</div>
                </div>
                {open.salaryBand && (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Salary Band</div>
                    <div className="mt-1 font-semibold">{open.salaryBand}</div>
                  </div>
                )}
              </div>
              {open.jdText && (
                <div>
                  <h4 className="mb-2 font-semibold">Job Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{open.jdText}</p>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Create requirement */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Requirement</DialogTitle>
            <DialogDescription>Add a job requirement for a client.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium">Client Company *</label>
                <select required value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select company…</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium">Job Title *</label>
                <Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Senior React Developer" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Location *</label>
                <Input required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Bangalore" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Salary Band</label>
                <Input value={form.salaryBand} onChange={e => setForm(f => ({ ...f, salaryBand: e.target.value }))} placeholder="18-28 LPA" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Urgency</label>
                <select value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Openings</label>
                <Input type="number" min="1" value={form.openingsCount} onChange={e => setForm(f => ({ ...f, openingsCount: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Job Description</label>
              <textarea rows={3} value={form.jdText} onChange={e => setForm(f => ({ ...f, jdText: e.target.value }))} placeholder="Role responsibilities…" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-[var(--ink)] text-background">
                {createMutation.isPending ? "Creating…" : "Create Requirement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
