import { Bell, Check, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { PageHeader, tone } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useListJoining,
  useCreateJoining,
  useUpdateJoining,
  useGetKanbanPipeline,
  getListJoiningQueryKey,
} from "@workspace/api-client-react";
import type { JoiningWithCandidate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export function JoiningPage() {
  const queryClient = useQueryClient();
  const { data: joiners = [], isLoading } = useListJoining({ limit: 50 });
  const { data: pipeline } = useGetKanbanPipeline({});
  const createJoining = useCreateJoining();
  const updateJoining = useUpdateJoining();

  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    pipelineId: "",
    joiningDate: "",
    noticePeriodDays: "",
    noticeStartDate: "",
  });

  // Entries eligible for joining tracking
  const eligibleEntries = [
    ...(pipeline?.offer ?? []),
    ...(pipeline?.joining ?? []),
  ] as Array<{ id: string; candidate?: { name: string } | null }>;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.pipelineId) { toast.error("Select a pipeline entry"); return; }
    createJoining.mutate(
      {
        data: {
          pipelineId: form.pipelineId,
          joiningDate: form.joiningDate || undefined,
          noticePeriodDays: form.noticePeriodDays ? Number(form.noticePeriodDays) : undefined,
          noticeStartDate: form.noticeStartDate || undefined,
        },
      },
      {
        onSuccess() {
          queryClient.invalidateQueries({ queryKey: getListJoiningQueryKey() });
          setIsAdding(false);
          setForm({ pipelineId: "", joiningDate: "", noticePeriodDays: "", noticeStartDate: "" });
          toast.success("Joining record created");
        },
        onError(err: any) { toast.error(err?.data?.error ?? "Failed to create joining record"); },
      }
    );
  }

  function handleToggleLaptop(joiner: JoiningWithCandidate) {
    updateJoining.mutate(
      { id: joiner.id, data: { laptopIssued: !joiner.laptopIssued } as any },
      {
        onSuccess() { queryClient.invalidateQueries({ queryKey: getListJoiningQueryKey() }); },
        onError(err: any) { toast.error(err?.data?.error ?? "Failed to update"); },
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
        title="Pre & post joining"
        subtitle="Notice-period countdowns and 30/60/90-day check-in status."
        actions={
          <Button
            className="rounded-full bg-[var(--ink)] text-background"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Track Joining
          </Button>
        }
      />

      {joiners.length === 0 ? (
        <div className="card-pastel bg-card py-12 text-center text-muted-foreground">
          <p className="mb-4">No joining records yet. Create one once an offer is accepted.</p>
          <Button onClick={() => setIsAdding(true)} className="rounded-full bg-[var(--ink)] text-background">
            <Plus className="mr-2 h-4 w-4" /> Add first joining record
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {joiners.map((j: JoiningWithCandidate) => {
            const notice = j.noticePeriodDays ?? 0;
            const noticeStart = j.noticeStartDate ? new Date(j.noticeStartDate) : null;
            const joiningDate = j.joiningDate ? new Date(j.joiningDate) : null;
            const now = new Date();

            let noticeLeft = 0;
            if (noticeStart && notice > 0) {
              const elapsed = Math.floor((now.getTime() - noticeStart.getTime()) / (1000 * 60 * 60 * 24));
              noticeLeft = Math.max(0, notice - elapsed);
            }

            const hasJoined = !!j.actualJoinedAt;
            const pct = notice > 0 ? ((notice - noticeLeft) / notice) * 100 : 100;
            const urgent = noticeLeft > 0 && noticeLeft <= 7;
            const stroke = urgent ? "var(--pastel-pink-ink)" : "var(--pastel-green-ink)";
            const bg = urgent ? "var(--pastel-pink)" : hasJoined ? "var(--pastel-green)" : "var(--pastel-blue)";

            const candidateName = j.candidate?.name ?? "Unknown";

            return (
              <div
                key={j.id}
                className="card-pastel bg-card flex flex-col items-center text-center"
              >
                <div className="text-base font-semibold">{candidateName}</div>
                <div className="text-xs text-muted-foreground">
                  {joiningDate ? `Joining: ${joiningDate.toLocaleDateString()}` : "Date TBD"}
                </div>

                <div className="relative mt-4 h-32 w-32">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke={bg} strokeWidth="10" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={stroke} strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${(pct * Math.PI * 84) / 100} ${Math.PI * 84}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold tabular-nums">
                      {hasJoined ? "✓" : noticeLeft > 0 ? noticeLeft : "—"}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {hasJoined ? "Joined" : noticeLeft > 0 ? "days left" : "Ready"}
                    </div>
                  </div>
                </div>

                {urgent && (
                  <Badge className={`mt-3 rounded-full ${tone("pastel-pink")}`}>
                    <Bell className="mr-1 h-3 w-3" /> Reminder due
                  </Badge>
                )}

                <div className="mt-4 grid w-full grid-cols-2 gap-2">
                  <div
                    className={`rounded-xl px-2 py-1.5 text-[11px] font-semibold ${j.bgvStatus === "cleared" ? tone("pastel-green") : "bg-muted text-muted-foreground"}`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {j.bgvStatus === "cleared" && <Check className="h-3 w-3" />} BGV
                    </div>
                  </div>
                  <div
                    className={`rounded-xl px-2 py-1.5 text-[11px] font-semibold ${j.laptopIssued ? tone("pastel-green") : "bg-muted text-muted-foreground"}`}
                    onClick={() => handleToggleLaptop(j)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {j.laptopIssued && <Check className="h-3 w-3" />} Laptop
                    </div>
                  </div>
                </div>

                {j.docCollectionStatus && (
                  <div className="mt-2 text-[10px] text-muted-foreground capitalize">
                    Docs: {j.docCollectionStatus.replace("_", " ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create joining dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Track Joining</DialogTitle>
            <DialogDescription>Create a joining record for an accepted candidate.</DialogDescription>
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
                <label className="mb-1 block text-xs font-medium">Joining Date</label>
                <Input
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) => setForm((f) => ({ ...f, joiningDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Notice Period (days)</label>
                <Input
                  type="number"
                  value={form.noticePeriodDays}
                  onChange={(e) => setForm((f) => ({ ...f, noticePeriodDays: e.target.value }))}
                  placeholder="30"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium">Notice Start Date</label>
                <Input
                  type="date"
                  value={form.noticeStartDate}
                  onChange={(e) => setForm((f) => ({ ...f, noticeStartDate: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" disabled={createJoining.isPending} className="bg-[var(--ink)] text-background">
                {createJoining.isPending ? "Creating…" : "Create Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
