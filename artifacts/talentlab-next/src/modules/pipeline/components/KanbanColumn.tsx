import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PipelineItem } from "../types";
import { KanbanCard } from "./KanbanCard";
import { Sparkles } from "lucide-react";

interface KanbanColumnProps {
  id: string;
  title: string;
  items: PipelineItem[];
  onCardClick: (item: PipelineItem) => void;
}

export function KanbanColumn({ id, title, items, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  // Calculate colors or header styles depending on stage id
  const headerColors: Record<string, string> = {
    SOURCED: "border-l-4 border-pastel-pink",
    SCREENED: "border-l-4 border-pastel-blue-ink",
    ASSESSED: "border-l-4 border-purple-500",
    SHORTLISTED: "border-l-4 border-orange-500",
    CLIENT_INTERVIEW: "border-l-4 border-yellow-500",
    OFFER: "border-l-4 border-pastel-green-ink",
    JOINING: "border-l-4 border-teal-500",
    POST_JOINING: "border-l-4 border-green-500",
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 md:w-80 shrink-0 rounded-2xl bg-card/25 border transition-all duration-200 ${
        isOver
          ? "border-primary bg-primary/5 ring-1 ring-primary/20 scale-[1.01]"
          : "border-border/60"
      }`}
    >
      {/* Column Header */}
      <div className={`p-4 flex items-center justify-between border-b border-border/40 bg-card/40 backdrop-blur-md rounded-t-2xl ${headerColors[id] || "border-l-4 border-border"}`}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-foreground/90 uppercase tracking-wider">
            {title}
          </span>
        </div>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-muted border border-border/30 text-muted-foreground">
          {items.length}
        </span>
      </div>

      {/* Scrollable Cards Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[500px] max-h-[calc(100vh-320px)] scrollbar-thin">
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          {items.length > 0 ? (
            items.map((item) => (
              <KanbanCard
                key={item.id}
                item={item}
                onClick={() => onCardClick(item)}
              />
            ))
          ) : (
            <div className="h-full min-h-[150px] flex flex-col items-center justify-center border border-dashed border-border/40 rounded-2xl p-4 text-center">
              <p className="text-[10px] text-muted-foreground/60 italic font-bold">
                Drop candidates here
              </p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
