import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PipelineItem } from "../types";
import {
  Calendar,
  CheckSquare,
  AlertCircle,
  Briefcase,
  Star,
  Tag,
  Building,
} from "lucide-react";

interface KanbanCardProps {
  item: PipelineItem;
  onClick: () => void;
}

export function KanbanCard({ item, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      item,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  // Calculate checklist progress
  const totalChecklists = item.checklists?.length || 0;
  const completedChecklists =
    item.checklists?.filter((c) => c.isCompleted).length || 0;
  const checklistProgressPercent =
    totalChecklists > 0
      ? Math.round((completedChecklists / totalChecklists) * 100)
      : 0;

  // Format experience helper
  const experienceText =
    item.candidate.experienceYears !== null
      ? `${item.candidate.experienceYears} yrs exp`
      : "N/A experience";

  // Urgency badge styling map
  const urgencyColors = {
    CRITICAL: "bg-red-500/20 text-red-400 border border-red-500/30",
    HIGH: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    NORMAL: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  };

  const urgencyText = {
    CRITICAL: "Critical",
    HIGH: "High Priority",
    NORMAL: "Normal Priority",
  };

  // Calculate days in stage
  const daysInStage = Math.floor(
    (Date.now() - new Date(item.stageUpdatedAt).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group bg-card/70 hover:bg-card border border-border/80 hover:border-border-accent rounded-2xl p-4 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all select-none duration-250`}
      onClick={onClick}
    >
      {/* Card Header & Drag Handler */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="space-y-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-black text-foreground group-hover:text-pastel-pink transition-colors truncate">
              {item.candidate.name}
            </h4>
            {item.job.urgency && item.job.urgency !== "NORMAL" && (
              <span className={`text-[8px] font-black px-1 py-0.2 rounded border uppercase tracking-wider ${urgencyColors[item.job.urgency]}`}>
                {urgencyText[item.job.urgency]}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground font-semibold truncate leading-normal">
            {item.candidate.currentRole || "Professional Candidate"}
          </p>
        </div>

        {/* Drag Handle Indicator */}
        <div
          {...attributes}
          {...listeners}
          className="p-1 rounded hover:bg-muted/40 cursor-grab text-muted-foreground/60 hover:text-muted-foreground transition-all shrink-0"
          title="Drag to update stage"
          onClick={(e) => e.stopPropagation()} // prevent opening drawer on drag trigger click
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path d="M4 8h16M4 16h16" />
          </svg>
        </div>
      </div>

      {/* Body Metadata details */}
      <div className="space-y-1.5 mb-3 border-t border-border/30 pt-2.5">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
          <Briefcase className="h-3.5 w-3.5 text-pastel-blue-ink shrink-0" />
          <span className="truncate">{item.job.title}</span>
        </div>
        <div className="flex items-center justify-between text-[9px] text-muted-foreground/80 font-bold">
          <div className="flex items-center gap-1">
            <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{item.job.company?.name || "TalentLab Team"}</span>
          </div>
          <span>{experienceText}</span>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-2 text-[9px] text-muted-foreground font-bold">
        {/* Checklist Progress */}
        {totalChecklists > 0 ? (
          <div className="flex items-center gap-1.5">
            <CheckSquare className={`h-3.5 w-3.5 ${completedChecklists === totalChecklists ? "text-pastel-green" : "text-muted-foreground"}`} />
            <span className={completedChecklists === totalChecklists ? "text-pastel-green font-extrabold" : ""}>
              {completedChecklists}/{totalChecklists} Tasks
            </span>
          </div>
        ) : (
          <div />
        )}

        {/* Days in stage warning / info */}
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {daysInStage === 0
              ? "Updated today"
              : `${daysInStage} ${daysInStage === 1 ? "day" : "days"} ago`}
          </span>
        </div>
      </div>
    </div>
  );
}
