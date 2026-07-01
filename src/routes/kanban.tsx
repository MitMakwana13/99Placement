import { useState, type DragEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GripVertical, MoreHorizontal } from "lucide-react";

import { PageHeader, tone } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { pipelineStages, candidates as initial, type Candidate, type StageKey } from "@/lib/mock-data";

export const Route = createFileRoute("/kanban")({
  head: () => ({ meta: [{ title: "Pipeline kanban · talentlab" }, { name: "description", content: "Drag-and-drop pipeline kanban across all stages." }] }),
  component: KanbanPage,
});

function KanbanPage() {
  const [items, setItems] = useState<Candidate[]>(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<StageKey | null>(null);

  const onDragStart = (id: string) => setDragId(id);
  const onDrop = (stage: StageKey) => {
    if (!dragId) return;
    setItems((arr) => arr.map((c) => (c.id === dragId ? { ...c, stage } : c)));
    setDragId(null);
    setOverStage(null);
  };
  const allow = (e: DragEvent, s: StageKey) => { e.preventDefault(); setOverStage(s); };

  return (
    <div className="space-y-6">
      <PageHeader title="Pipeline kanban" subtitle="Drag candidates between stages. The most satisfying screen in the tool." />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipelineStages.map((stage) => {
          const stageItems = items.filter((c) => c.stage === stage.key);
          const isOver = overStage === stage.key;
          return (
            <div
              key={stage.key}
              onDragOver={(e) => allow(e, stage.key)}
              onDragLeave={() => setOverStage(null)}
              onDrop={() => onDrop(stage.key)}
              className={`w-72 shrink-0 rounded-3xl p-3 transition ${isOver ? "ring-2 ring-[var(--ink)]" : ""}`}
              style={{ background: stage.color }}
            >
              <div className="flex items-center justify-between px-2 pb-3 text-[var(--ink)]">
                <h3 className="text-sm font-semibold">{stage.label}</h3>
                <Badge className="rounded-full bg-[var(--ink)] text-background">{stageItems.length}</Badge>
              </div>

              <div className="space-y-2">
                {stageItems.map((c) => (
                  <article
                    key={c.id}
                    draggable
                    onDragStart={() => onDragStart(c.id)}
                    className={`group cursor-grab rounded-2xl bg-card p-3 shadow-sm transition active:cursor-grabbing ${dragId === c.id ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-1 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                      <span className={`grid h-9 w-9 place-items-center rounded-xl text-[11px] font-bold ${tone("pastel-pink")}`}>{c.initials}</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold leading-tight">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.role}</div>
                      </div>
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.skills.slice(0, 3).map((s) => <span key={s} className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{s}</span>)}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{c.experience}y · {c.location}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tone("pastel-yellow")}`}>{c.source}</span>
                    </div>
                  </article>
                ))}
                {stageItems.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[var(--ink)]/20 p-6 text-center text-[11px] text-[var(--ink)]/60">Drop here</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
