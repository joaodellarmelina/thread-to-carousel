"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "@/lib/store";
import { ASPECT_DIMENSIONS } from "@/lib/types";
import type { SlideMedia } from "@/lib/types";
import { TWEET_MAX_CHARS } from "@/lib/constants";
import { TweetCard } from "./tweet-card";
import { MediaDropzone } from "./media-dropzone";
import { TextFitDialog } from "./text-fit-dialog";
import { TextFitProbe, type TextFitResult } from "./text-fit-probe";

const INITIAL_FIT: TextFitResult = { maxChars: TWEET_MAX_CHARS, overflowed: false, trimmedText: "" };

export function SlideCanvas() {
  const slides = useAppStore((s) => s.slides);
  const selectedSlideId = useAppStore((s) => s.selectedSlideId);
  const profile = useAppStore((s) => s.profile);
  const cardTheme = useAppStore((s) => s.cardTheme);
  const cardStyle = useAppStore((s) => s.cardStyle);
  const frameBackground = useAppStore((s) => s.frameBackground);
  const aspectRatio = useAppStore((s) => s.aspectRatio);
  const postDateTime = useAppStore((s) => s.postDateTime);
  const showXLogo = useAppStore((s) => s.showXLogo);
  const updateSlideText = useAppStore((s) => s.updateSlideText);
  const setMediaFocalPoint = useAppStore((s) => s.setMediaFocalPoint);
  const clearMedia = useAppStore((s) => s.clearMedia);

  const videoRef = useRef<HTMLVideoElement>(null);
  const slide = slides.find((s) => s.id === selectedSlideId) ?? slides[0];

  const [fit, setFit] = useState<TextFitResult>(INITIAL_FIT);
  const [pendingOverflow, setPendingOverflow] = useState<{
    originalText: string;
    trimmedText: string;
  } | null>(null);

  // The last media we've already reacted to for the CURRENT slide — lets us tell
  // "media just changed, ask before shortening text" apart from "aspect
  // ratio/template changed globally, just re-fit quietly" from the same
  // measurement. Reset synchronously during render (React's documented pattern
  // for "adjust state when a prop changes") the instant the selected slide
  // changes — this runs before any effect (including the probe's), so there's
  // no ordering race between resetting this and the probe's first measurement.
  // Plain state (not a ref) since we're already re-rendering in this branch.
  const [trackedSlideId, setTrackedSlideId] = useState(slide?.id);
  const [resolvedMedia, setResolvedMedia] = useState<SlideMedia | undefined>(slide?.media);
  if (slide && slide.id !== trackedSlideId) {
    setTrackedSlideId(slide.id);
    setResolvedMedia(slide.media);
    setFit(INITIAL_FIT);
    setPendingOverflow(null);
  }

  if (!slide) return null;

  const dims = ASPECT_DIMENSIONS[aspectRatio];

  function handleMeasured(result: TextFitResult) {
    setFit(result);
    if (!result.overflowed) return;

    const mediaChanged = slide.media !== resolvedMedia;
    setResolvedMedia(slide.media);

    if (mediaChanged && slide.media) {
      setPendingOverflow({ originalText: slide.text, trimmedText: result.trimmedText });
    } else {
      // Aspect ratio/template/date changed globally, not a single undoable
      // action on this slide — silently re-fit, same as the rest of the deck.
      updateSlideText(slide.id, result.trimmedText);
    }
  }

  function handleKeepShortened() {
    if (!pendingOverflow) return;
    updateSlideText(slide.id, pendingOverflow.trimmedText);
    setPendingOverflow(null);
  }

  function handleUndoMedia() {
    if (!pendingOverflow) return;
    clearMedia(slide.id);
    setResolvedMedia(undefined);
    setPendingOverflow(null);
  }

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
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <div className="h-full overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]">
              <TweetCard
                slide={slide}
                profile={profile}
                theme={cardTheme}
                cardStyle={cardStyle}
                frameBackground={frameBackground}
                aspectRatio={aspectRatio}
                postDateTime={postDateTime}
                maxChars={fit.maxChars}
                showXLogo={showXLogo}
                editable
                onTextChange={(text) => updateSlideText(slide.id, text)}
                onMediaFocalPointChange={({ x, y }) => setMediaFocalPoint(slide.id, x, y)}
                videoRef={videoRef}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex items-center justify-end px-1 text-xs tabular-nums text-[var(--app-fg-muted)]">
          <span className={slide.text.length >= fit.maxChars ? "text-amber-400" : ""}>
            {slide.text.length}/{fit.maxChars}
          </span>
        </div>
        <MediaDropzone slideId={slide.id} media={slide.media} />
      </div>

      <TextFitProbe
        slide={slide}
        profile={profile}
        theme={cardTheme}
        cardStyle={cardStyle}
        frameBackground={frameBackground}
        aspectRatio={aspectRatio}
        postDateTime={postDateTime}
        showXLogo={showXLogo}
        onMeasured={handleMeasured}
      />

      <AnimatePresence>
        {pendingOverflow && (
          <TextFitDialog
            key="text-fit-dialog"
            removedChars={pendingOverflow.originalText.length - pendingOverflow.trimmedText.length}
            onKeep={handleKeepShortened}
            onUndo={handleUndoMedia}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
