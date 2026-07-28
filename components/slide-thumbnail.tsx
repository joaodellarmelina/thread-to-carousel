"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "motion/react";
import { Copy, Trash2, GripVertical } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Slide } from "@/lib/types";
import { TWEET_MAX_CHARS } from "@/lib/constants";
import { TweetCard } from "./tweet-card";

export function SlideThumbnail({ slide, index }: { slide: Slide; index: number }) {
  const selectedSlideId = useAppStore((s) => s.selectedSlideId);
  const selectSlide = useAppStore((s) => s.selectSlide);
  const duplicateSlide = useAppStore((s) => s.duplicateSlide);
  const removeSlide = useAppStore((s) => s.removeSlide);
  const profile = useAppStore((s) => s.profile);
  const cardTheme = useAppStore((s) => s.cardTheme);
  const cardStyle = useAppStore((s) => s.cardStyle);
  const frameBackground = useAppStore((s) => s.frameBackground);
  const aspectRatio = useAppStore((s) => s.aspectRatio);
  const postDateTime = useAppStore((s) => s.postDateTime);
  const showXLogo = useAppStore((s) => s.showXLogo);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });

  const isSelected = slide.id === selectedSlideId;

  return (
    // dnd-kit owns this outer node's transform/transition (drag positioning) — kept
    // separate from the inner motion.div so the two never fight over the same CSS props.
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
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="group relative"
      >
        <button
          data-cuelume-press
          data-cuelume-hover="tick"
          onClick={() => selectSlide(slide.id)}
          className={`relative block w-full overflow-hidden rounded-xl ring-2 transition-shadow ${
            isSelected ? "ring-[var(--app-accent)]" : "ring-transparent hover:ring-white/15"
          }`}
        >
          <TweetCard
            slide={slide}
            profile={profile}
            theme={cardTheme}
            cardStyle={cardStyle}
            frameBackground={frameBackground}
            aspectRatio={aspectRatio}
            postDateTime={postDateTime}
            maxChars={TWEET_MAX_CHARS}
            showXLogo={showXLogo}
          />
          <div className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/80">
            {index + 1}
          </div>
        </button>

        <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            data-cuelume-press
            title="duplicate"
            onClick={() => duplicateSlide(slide.id)}
            className="rounded-md bg-black/60 p-1 text-white/80 transition-[color,transform] hover:text-white active:scale-90"
          >
            <Copy size={12} />
          </button>
          <button
            data-cuelume-press
            title="delete"
            onClick={() => removeSlide(slide.id)}
            className="rounded-md bg-black/60 p-1 text-white/80 transition-[color,transform] hover:text-red-400 active:scale-90"
          >
            <Trash2 size={12} />
          </button>
        </div>

        <div
          {...attributes}
          {...listeners}
          className="absolute bottom-1.5 right-1.5 cursor-grab rounded-md bg-black/60 p-1 text-white/60 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          title="drag to reorder"
        >
          <GripVertical size={12} />
        </div>
      </motion.div>
    </div>
  );
}
