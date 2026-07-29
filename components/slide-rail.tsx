"use client";

import { useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { SlideThumbnail } from "./slide-thumbnail";

/** Per-item stagger step for newly-mounted thumbnails, capped so a large
 *  thread import never delays later thumbnails by more than 200ms. */
const STAGGER_STEP = 0.04;
const STAGGER_CAP_INDEX = 5;

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

  // Ids present as of the last committed render — diffing against this each
  // render tells us which ids are genuinely new (just imported/added), as
  // opposed to a reorder or edit re-rendering the same set of ids. Adjusted
  // synchronously during render (React's documented "previous value" pattern,
  // also used for trackedSlideId in slide-canvas.tsx) rather than in an
  // effect, so the very render that introduces new ids is the one that sees
  // them as "added" — an effect would only catch it a render late.
  const [prevIds, setPrevIds] = useState<string[]>(() => slides.map((s) => s.id));
  const currentIds = slides.map((s) => s.id);
  const idsChanged = currentIds.length !== prevIds.length || currentIds.some((id, i) => id !== prevIds[i]);
  const addedIds = idsChanged ? currentIds.filter((id) => !prevIds.includes(id)) : [];
  if (idsChanged) {
    setPrevIds(currentIds);
  }

  return (
    <aside className="material flex w-44 shrink-0 flex-col gap-3 overflow-y-auto border-y-0 border-l-0 p-3 sm:w-52">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {slides.map((slide, i) => {
                const batchIndex = addedIds.indexOf(slide.id);
                const enterDelay = batchIndex === -1 ? 0 : Math.min(batchIndex, STAGGER_CAP_INDEX) * STAGGER_STEP;
                return (
                  <SlideThumbnail key={slide.id} slide={slide} index={i} enterDelay={enterDelay} />
                );
              })}
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
