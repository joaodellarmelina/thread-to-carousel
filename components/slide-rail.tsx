"use client";

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { SlideThumbnail } from "./slide-thumbnail";

export function SlideRail() {
  const slides = useAppStore((s) => s.slides);
  const reorderSlides = useAppStore((s) => s.reorderSlides);
  const addSlide = useAppStore((s) => s.addSlide);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderSlides(String(active.id), String(over.id));
    }
  }

  return (
    <aside className="material flex w-44 shrink-0 flex-col gap-3 overflow-y-auto border-y-0 border-l-0 p-3 sm:w-52">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {slides.map((slide, i) => (
                <SlideThumbnail key={slide.id} slide={slide} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      <button
        data-cuelume-press
        data-cuelume-release
        data-cuelume-hover="tick"
        onClick={() => addSlide()}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 py-3 text-xs font-medium text-[var(--app-fg-muted)] transition-[color,border-color,transform] hover:border-white/30 hover:text-[var(--app-fg)] active:scale-[0.97]"
      >
        <Plus size={14} />
        <span className="lowercase">add slide</span>
      </button>
    </aside>
  );
}
