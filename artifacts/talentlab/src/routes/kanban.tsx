import { useState, type DragEvent } from "react";
import { GripVertical, MoreHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, tone } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  useGetKanbanPipeline,
  useUpdatePipelineStage,
  getGetKanbanPipelineQueryKey,
} from "@workspace/api-client-react";
import type { PipelineEntryWithCandidate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const STAGES = [
  { key: "sourced", label: "Candidate Sourcing", color: "oklch(0.9 0.08 90)" },
  { key: "screened", label: "99 Screening", color: "oklch(0.9 0.06 30)" },
  { key: "assessed", label: "99 Assessment", color: "oklch(0.87 0.08 340)" },
  { key: "shortlisted", label: "Shortlisted", color: "oklch(0.87 0.08 270)" },
  { key: "client_interview", label: "Client Interview", color: "oklch(0.89 0.06 195)" },
  { key: "offer", label: "Offer", color: "oklch(0.88 0.08 145)" },
  { key: "joining", label: "Joining", color: "oklch(0.88 0.08 145)" },
] as const;

type StageKey = typeof STAGES[number]["key"];

export function KanbanPage() {
  const queryClient = useQueryClient();
  const { data: kanban, isLoading } = useGetKanbanPipeline({});
  const stageMutation = useUpdatePipelineStage();

  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<StageKey | null>(null);

  const onDragStart = (id: string) => setDragId(id);

  const onDrop = (stage: StageKey) => {
    if (!dragId) return;
    setDragId(null);
    setOverStage(null);

    stageMutation.mutate(
      { id: dragId, data: { stage } },
      {
        onSuccess() {
          queryClient.invalidateQueries({ queryKey: getGetKanbanPipelineQueryKey({}) });
        },
        onError(err: any) {
          toast.error(err?.data?.error ?? "Failed to move candidate");
        },
      }
    );
  };

  const allow = (e: DragEvent, s: StageKey) => { e.preventDefault(); setOverStage(s); };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pipeline kanban" subtitle="Drag candidates between stages. Changes are saved instantly." />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageItems: PipelineEntryWithCandidate[] = (kanban?.[stage.key as keyof typeof kanban] as PipelineEntryWithCandidate[] | undefined) ?? [];
          const isOver = overStage === stage.key;

          return (
            <div
              key={stage.key}
              onDragOver={(e) => allow(e, stage.key as StageKey)}
              onDragLeave={() => setOverStage(null)}
              onDrop={() => onDrop(stage.key as StageKey)}
              className={`w-72 shrink-0 rounded-3xl p-3 transition ${isOver ? "ring-2 ring-[var(--ink)]" : ""}`}
              style={{ background: stage.color }}
            >
              <div className="flex items-center justify-between px-2 pb-3 text-[var(--ink)]">
                <h3 className="text-sm font-semibold">{stage.label}</h3>
                <Badge className="rounded-full bg-[var(--ink)] text-background">{stageItems.length}</Badge>
              </div>

              <div className="space-y-2">
                {stageItems.map((entry) => {
                  const c = entry.candidate;
                  if (!c) return null;
                  return (
                    <article
                      key={entry.id}
                      draggable
                      onDragStart={() => onDragStart(entry.id)}
                      className={`group cursor-grab rounded-2xl bg-card p-3 shadow-sm transition active:cursor-grabbing ${dragId === entry.id ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-1 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[11px] font-bold ${tone("pastel-pink")}`}>
                          {c.initials ?? c.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold leading-tight truncate">{c.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{c.currentRole}</div>
                        </div>
                        <MoreHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(c.skills ?? []).slice(0, 3).map((s) => (
                          <span key={s} className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{s}</span>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{c.experienceYears != null ? `${c.experienceYears}y` : ""}{c.location ? ` · ${c.location}` : ""}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tone("pastel-yellow")}`}>
                          {c.source.charAt(0).toUpperCase() + c.source.slice(1)}
                        </span>
                      </div>
                    </article>
                  );
                })}
                {stageItems.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[var(--ink)]/20 p-6 text-center text-[11px] text-[var(--ink)]/60">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
