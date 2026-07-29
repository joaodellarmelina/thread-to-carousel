# 005 — Stagger newly-added slide thumbnails on mount

- **Status**: TODO
- **Commit**: a2b3d67
- **Severity**: LOW
- **Category**: Cohesion (stagger)
- **Estimated scope**: 2 files, moderate (new ref-diffing logic + one prop threaded through)

## Problem

Importing a thread with N tweets mounts N slide thumbnails in the rail
simultaneously. Each fades in independently via `AnimatePresence
initial={false}` with no stagger, so a multi-tweet import currently reads as
one simultaneous "pop" instead of a considered, sequential reveal.

```tsx
/* components/slide-rail.tsx:26-38 — current */
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
```

```tsx
/* components/slide-thumbnail.tsx:41-51 — current */
<motion.div
  layout
  // Opacity-only for mount/unmount — a `scale` transform on an ancestor of
  // overflow-hidden text can cause a momentary sub-pixel clip on tall
  // glyphs mid-animation in some browsers. Fading avoids that entirely.
  initial={{ opacity: 0 }}
  animate={{ opacity: isDragging ? 0.5 : 1 }}
  exit={{ opacity: 0 }}
  transition={{ type: "spring", bounce: 0, duration: 0.3 }}
  className="group relative"
>
```

A naive fix (stagger by absolute array index `i`) is wrong: clicking "add
slide" once when 12 slides already exist would delay that single new
thumbnail's entrance by `12 * delay` for no reason — the delay must be
relative to an item's position **among slides newly added in the same
update**, not its position in the whole deck.

## Target

`components/slide-rail.tsx` tracks which slide ids are new since its last
render (a simple "previous ids" ref diff) and passes each newly-added slide
its position within that batch, capped at 5, as an `enterDelay` in seconds
(40ms per step, capped at 200ms):

```tsx
/* target — components/slide-rail.tsx, full file */
"use client";

import { useEffect, useRef } from "react";
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
  // opposed to a reorder or edit re-rendering the same set of ids. Updated
  // in an effect (post-commit) so this render's diff always compares against
  // the previous render's ids, never the current one.
  const prevIdsRef = useRef<string[]>(slides.map((s) => s.id));
  const currentIds = slides.map((s) => s.id);
  const addedIds = currentIds.filter((id) => !prevIdsRef.current.includes(id));
  useEffect(() => {
    prevIdsRef.current = currentIds;
  });

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
```

```tsx
/* target — components/slide-thumbnail.tsx, changed parts only */
export function SlideThumbnail({
  slide,
  index,
  enterDelay = 0,
}: {
  slide: Slide;
  index: number;
  /** Seconds to delay this thumbnail's mount-in fade — 0 for anything that
   *  isn't part of a fresh batch of newly-added slides (see slide-rail.tsx). */
  enterDelay?: number;
}) {
  /* ...unchanged hooks... */

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? "none" : transition,
      }}
    >
      <motion.div
        layout
        // Opacity-only for mount/unmount — a `scale` transform on an ancestor of
        // overflow-hidden text can cause a momentary sub-pixel clip on tall
        // glyphs mid-animation in some browsers. Fading avoids that entirely.
        initial={{ opacity: 0 }}
        animate={{ opacity: isDragging ? 0.5 : 1 }}
        exit={{ opacity: 0 }}
        transition={{
          layout: { type: "spring", bounce: 0, duration: 0.3 },
          opacity: { type: "spring", bounce: 0, duration: 0.3, delay: enterDelay },
        }}
        className="group relative"
      >
        {/* ...unchanged... */}
```

## Repo conventions to follow

- Springs in this repo always use `{ type: "spring", bounce: 0, duration: N }`
  — never introduce a bezier curve or a bouncy spring here; keep `bounce: 0`
  exactly as the existing transition already has it.
- Per-key `transition` objects (splitting `layout` from the animated
  property) are not yet used elsewhere in this repo, but this is standard
  Motion API — see [Motion's transition docs] pattern of keying by animated
  property name (`opacity`, `layout`, etc.) inside the `transition` object;
  no new dependency is needed, `motion/react` already supports this.
- The "previous value via ref + effect" pattern for diffing renders is not
  yet used elsewhere in this repo; the code above is the first instance —
  keep it exactly as scoped (local to `slide-rail.tsx`, not extracted into
  `lib/`) since it's only needed here.

## Steps

1. In `components/slide-rail.tsx`, add `useEffect` and `useRef` to the
   existing `"use client"` React import line.
2. Add the two constants `STAGGER_STEP = 0.04` and `STAGGER_CAP_INDEX = 5`
   above the component (module scope).
3. Inside `SlideRail`, after the existing store selectors and before
   `handleDragEnd`, add the `prevIdsRef`, `currentIds`, `addedIds` computation
   and the `useEffect` that updates `prevIdsRef.current`, exactly as shown in
   the target code above.
4. In the `AnimatePresence` map, change `{slides.map((slide, i) => (<SlideThumbnail key={slide.id} slide={slide} index={i} />))}`
   to compute `batchIndex`/`enterDelay` per slide and pass `enterDelay` to
   `SlideThumbnail`, exactly as shown.
5. In `components/slide-thumbnail.tsx`, add `enterDelay = 0` to the
   destructured props and its type (`enterDelay?: number`).
6. Replace the single `transition={{ type: "spring", bounce: 0, duration: 0.3 }}`
   on the inner `motion.div` with the per-key `transition={{ layout: {...}, opacity: {...} }}`
   object shown above, wiring `enterDelay` into the `opacity` key's `delay`.
7. Do not change any other prop, hook, or JSX in either file.

## Boundaries

- Do NOT touch any other file.
- Do NOT change `SlideThumbnail`'s existing `index` prop or its usage (the
  `{index + 1}` badge) — `enterDelay` is a new, separate prop.
- Do NOT stagger the `layout` transition (used for drag-reorder animation) —
  only the `opacity` transition gets the delay. If layout also gets delayed,
  reorders will feel laggy — this is a hard requirement, not a preference.
- Do NOT add new dependencies.
- If either file's current code no longer matches what's quoted above (props
  renamed, structure changed), STOP and report instead of improvising where
  to splice in the new logic.

## Verification

- **Mechanical**: `npx tsc --noEmit`, `npm run lint`, `npm run build` — all clean.
- **Feel check**:
  - Paste a thread with 5+ tweets (via "paste a thread") into an empty
    project — the thumbnails in the rail should visibly fade in one after
    another, roughly 40ms apart, not all at once. In DevTools Animations
    panel, set playback to 10% and confirm distinct, sequential start times
    for the opacity animations (not layout — layout should still start
    immediately/together, since reflow must not lag).
  - Click "add slide" once when slides already exist — the new thumbnail
    must appear with **no** added delay (same feel as before this change) —
    this is the regression case the batch-relative design exists to prevent.
  - Reorder two slides via drag — the layout-shift animation must be
    unaffected (no stagger, no added delay) since `layout`'s transition was
    deliberately left untouched.
  - Delete a slide — it should fade out immediately, not carry a leftover
    stagger delay from when it was added (verify by importing a thread, then
    immediately deleting the 4th or 5th thumbnail — it should NOT visibly
    hesitate before fading out).
  - Toggle `prefers-reduced-motion` (Rendering panel) and confirm the
    existing `MotionConfig reducedMotion="user"` behavior (in
    `components/editor.tsx`) still suppresses this motion appropriately —
    no separate handling is needed here since it inherits from that
    top-level config.
- **Done when**: multi-slide imports visibly stagger in (~40ms/item, capped
  at 200ms), single-slide adds and reorders are unaffected, and the build is
  clean.
