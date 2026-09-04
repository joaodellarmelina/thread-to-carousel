"use client";

import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "@/lib/store";
import { ASPECT_DIMENSIONS } from "@/lib/types";
import { TWEET_MAX_CHARS } from "@/lib/constants";
import { countCharacters } from "@/lib/characters";
import { backdropFade } from "@/lib/motion";
import { TweetCard } from "./tweet-card";
import { MediaDropzone } from "./media-dropzone";
import { RichTextToolbar } from "./rich-text-toolbar";

export function SlideCanvas() {
  const slides = useAppStore((s) => s.slides);
  const selectedSlideId = useAppStore((s) => s.selectedSlideId);
  const cardTheme = useAppStore((s) => s.cardTheme);
  const cardStyle = useAppStore((s) => s.cardStyle);
  const frameBackground = useAppStore((s) => s.frameBackground);
  const aspectRatio = useAppStore((s) => s.aspectRatio);
  const updateSlideContent = useAppStore((s) => s.updateSlideContent);
  const setMediaFocalPoint = useAppStore((s) => s.setMediaFocalPoint);

  const slide = slides.find((s) => s.id === selectedSlideId) ?? slides[0];

  if (!slide) return null;

  const dims = ASPECT_DIMENSIONS[aspectRatio];

  return (
    <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-6 py-8">
      {/* Fixed aspect-ratio positioning context so outgoing/incoming slides can overlap
          and cross-fade instead of waiting for a sequential exit-then-enter. */}
      <div className="relative w-full max-w-sm" style={{ aspectRatio: `${dims.width} / ${dims.height}` }}>
        <AnimatePresence>
          <motion.div
            key={slide.id}
            // Opacity-only — a `scale` transform on an ancestor of overflow-hidden
            // text can cause a momentary sub-pixel clip on tall glyphs (e.g. capital
            // letters) mid-animation in some browsers. Fading avoids that entirely.
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropFade}
            className="absolute inset-0"
          >
            <div className="h-full overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]">
              <TweetCard
                slide={slide}
                theme={cardTheme}
                cardStyle={cardStyle}
                frameBackground={frameBackground}
                aspectRatio={aspectRatio}
                maxChars={TWEET_MAX_CHARS}
                editable
                onContentChange={(text, richText) => updateSlideContent(slide.id, text, richText)}
                onMediaFocalPointChange={(mediaId, { x, y }) => setMediaFocalPoint(slide.id, mediaId, x, y)}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex items-center justify-between gap-3 px-1 text-xs tabular-nums text-[var(--app-fg-muted)]">
          <RichTextToolbar slideId={slide.id} />
          <span className={countCharacters(slide.text) >= TWEET_MAX_CHARS ? "text-amber-400" : ""}>
            {countCharacters(slide.text)}/{TWEET_MAX_CHARS}
          </span>
        </div>
        <MediaDropzone slideId={slide.id} media={slide.media} />
      </div>

    </div>
  );
}
