import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { PipelineItem } from "../types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { useUpdatePipelineStage } from "../hooks/useUpdatePipelineStage";

interface KanbanBoardProps {
  items: PipelineItem[];
  onCardClick: (item: PipelineItem) => void;
}

const COLUMNS = [
  { id: "SOURCED", title: "Sourced" },
  { id: "SCREENED", title: "Screened" },
  { id: "ASSESSED", title: "Assessed" },
  { id: "SHORTLISTED", title: "Shortlisted" },
  { id: "CLIENT_INTERVIEW", title: "Interview" },
  { id: "OFFER", title: "Offer" },
  { id: "JOINING", title: "Joining" },
  { id: "POST_JOINING", title: "Joined" },
];

export function KanbanBoard({ items, onCardClick }: KanbanBoardProps) {
  const updateStageMutation = useUpdatePipelineStage();
  const [activeItem, setActiveItem] = useState<PipelineItem | null>(null);

  // Configure sensors with delay/distance activation constraints
  // This allows normal click handlers (opening Candidate Drawer) to function cleanly
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag threshold
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group items by column stage
  const itemsByStage = COLUMNS.reduce<Record<string, PipelineItem[]>>((acc, col) => {
    acc[col.id] = items.filter((item) => item.stage === col.id);
    return acc;
  }, {});

  const handleDragStart = (event: DragStartEvent) => {
    const cardId = event.active.id as string;
    const foundItem = items.find((it) => it.id === cardId);
    if (foundItem) {
      setActiveItem(foundItem);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const cardId = active.id as string;
    const overId = over.id as string;

    // Check if the target is a column ID
    const isColumn = COLUMNS.some((col) => col.id === overId);
    let targetStage = "";

    if (isColumn) {
      targetStage = overId;
    } else {
      // If dropped over another card, find that card's stage
      const targetCard = items.find((it) => it.id === overId);
      if (targetCard) {
        targetStage = targetCard.stage;
      }
    }

    const currentCard = items.find((it) => it.id === cardId);

    if (currentCard && targetStage && currentCard.stage !== targetStage) {
      updateStageMutation.mutate({
        id: cardId,
        stage: targetStage,
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-5 overflow-x-auto pb-6 pt-2 select-none min-h-[600px] scrollbar-thin">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            items={itemsByStage[col.id] || []}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      {/* Floating Drag Overlay Preview */}
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="w-72 md:w-80 rotate-[2deg] scale-[1.02] shadow-xl border-primary ring-2 ring-primary/20 pointer-events-none">
            <KanbanCard item={activeItem} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
