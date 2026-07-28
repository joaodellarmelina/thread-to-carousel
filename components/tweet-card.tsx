"use client";

import { forwardRef, useRef } from "react";
import type { Profile, Slide, CardTheme, CardStyle, AspectRatio } from "@/lib/types";
import { ASPECT_DIMENSIONS } from "@/lib/types";
import { formatPostDateTime } from "@/lib/date";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import { XLogo, VerifiedBadge, PlayGlyph } from "./icons";
import { MediaFocalDrag } from "./media-focal-drag";

interface TweetCardProps {
  slide: Slide;
  profile: Profile;
  theme: CardTheme;
  cardStyle: CardStyle;
  frameBackground: string;
  aspectRatio: AspectRatio;
  /** "datetime-local" value, e.g. "2023-06-07T10:39" — same for every slide. */
  postDateTime: string;
  /** The real, currently-measured character ceiling for this exact configuration
   *  (see TextFitProbe) — never a guess. Non-editable instances can pass TWEET_MAX_CHARS. */
  maxChars: number;
  /** Whether to show the X wordmark glyph in the card header. Defaults to true. */
  showXLogo?: boolean;
  editable?: boolean;
  onTextChange?: (text: string) => void;
  onMediaFocalPointChange?: (point: { x: number; y: number }) => void;
  videoRef?: React.Ref<HTMLVideoElement>;
  /** When set, replaces a video slide's <video> with this frame — used while capturing exports. */
  posterOverride?: string;
}

export const TweetCard = forwardRef<HTMLDivElement, TweetCardProps>(function TweetCard(
  {
    slide,
    profile,
    theme,
    cardStyle,
    frameBackground,
    aspectRatio,
    postDateTime,
    maxChars,
    showXLogo = true,
    editable = false,
    onTextChange,
    onMediaFocalPointChange,
    videoRef,
    posterOverride,
  },
  ref
) {
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dims = ASPECT_DIMENSIONS[aspectRatio];
  const isDark = theme === "dark";
  const isFramed = cardStyle === "framed";
  const cardBg = isDark ? "#000000" : "#ffffff";
  const timestampLabel = formatPostDateTime(postDateTime);

  // Layout effect (not a passive one) — commits before paint, so a parent
  // measuring this synced text (see TextFitProbe) never sees a stale frame.
  useIsomorphicLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // Don't clobber the live cursor position while this instance is being typed into.
    if (editable && document.activeElement === el) return;
    if (el.textContent !== slide.text) {
      el.textContent = slide.text;
    }
  }, [slide.id, slide.text, editable]);

  return (
    <div
      ref={ref}
      data-export-card
      className="relative flex select-none flex-col overflow-hidden"
      style={{
        containerType: "inline-size",
        aspectRatio: `${dims.width} / ${dims.height}`,
        width: "100%",
        // Pinned independent of the app shell's display font — generated cards
        // must keep looking like real tweets, not like the app's own branding.
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        background: isFramed ? frameBackground : cardBg,
        // Outer box is the literal export canvas — must stay a plain rectangle
        // (rounding it would produce a non-rectangular Instagram export).
        borderRadius: "0",
      }}
    >
      {/* Frame inset (only present for the "framed" template) */}
      <div className="overflow-hidden" style={{ flex: 1, minHeight: 0, padding: isFramed ? "3.5cqw" : "0" }}>
        <div
          className={`flex h-full flex-col overflow-hidden ${isDark ? "text-white" : "text-[#0f1419]"}`}
          style={{ background: cardBg, borderRadius: isFramed ? "4cqw" : "0" }}
        >
          <div className="flex h-full flex-col" style={{ padding: "6cqw" }}>
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between" style={{ marginBottom: "4.5cqw" }}>
              <div className="flex min-w-0 items-center" style={{ gap: "2.6cqw" }}>
                <div
                  className={`shrink-0 overflow-hidden rounded-full ${isDark ? "bg-[#2f3336]" : "bg-[#e5e5e6]"}`}
                  style={{ width: "13cqw", height: "13cqw" }}
                >
                  {profile.avatarDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatarDataUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center font-semibold"
                      style={{ fontSize: "5cqw" }}
                    >
                      {profile.name.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center leading-tight">
                  <div className="flex min-w-0 items-center" style={{ gap: "1cqw" }}>
                    <span className="min-w-0 truncate font-bold" style={{ fontSize: "3.9cqw" }}>
                      {profile.name}
                    </span>
                    {profile.verified && (
                      <VerifiedBadge className="shrink-0" style={{ width: "3.6cqw", height: "3.6cqw" }} />
                    )}
                  </div>
                  <span
                    className={`block truncate ${isDark ? "text-[#71767b]" : "text-[#536471]"}`}
                    style={{ fontSize: "3.4cqw" }}
                  >
                    @{profile.handle}
                  </span>
                </div>
              </div>
              {showXLogo && <XLogo className="shrink-0" style={{ width: "5.5cqw", height: "5.5cqw" }} />}
            </div>

            {/* Body text */}
            <div
              ref={textRef}
              data-tweet-body
              contentEditable={editable}
              suppressContentEditableWarning
              onKeyDown={(e) => {
                // contentEditable's default Enter behavior inserts a new block
                // element (e.g. a <div>), which contributes ~0 to .textContent's
                // length — so the character cap below never sees it and Enter
                // can be pressed unboundedly. Insert a literal "\n" text node
                // directly via Range/Selection instead (rendered as a line break
                // via whitespace-pre-wrap, same as execCommand would render it,
                // but execCommand("insertText", "\n") is a no-op for newlines in
                // some browsers) — this way every line break is a real character
                // that counts toward and is capped by maxChars like any other.
                if (e.key !== "Enter") return;
                e.preventDefault();
                const el = e.currentTarget;
                if ((el.textContent ?? "").length >= maxChars) return;
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) return;
                const range = selection.getRangeAt(0);
                range.deleteContents();
                const newline = document.createTextNode("\n");
                range.insertNode(newline);
                range.setStartAfter(newline);
                range.setEndAfter(newline);
                selection.removeAllRanges();
                selection.addRange(range);
                onTextChange?.(el.textContent ?? "");
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                let text = el.textContent ?? "";
                // maxChars is a live, measured value (see TextFitProbe) — this is a
                // plain length cap, no DOM measurement here at all.
                if (text.length > maxChars) {
                  text = text.slice(0, maxChars);
                  el.textContent = text;
                  const range = document.createRange();
                  const selection = window.getSelection();
                  range.selectNodeContents(el);
                  range.collapse(false);
                  selection?.removeAllRanges();
                  selection?.addRange(range);
                }
                onTextChange?.(text);
              }}
              className={`min-h-0 min-w-0 flex-1 overflow-hidden whitespace-pre-wrap outline-none ${editable ? "cursor-text" : ""}`}
              style={{
                fontSize: "4.4cqw",
                lineHeight: 1.4,
                letterSpacing: "-0.005em",
                // A long unbroken run (no spaces — a URL, or just mashing the keyboard)
                // must still wrap instead of overflowing the fixed-size card.
                overflowWrap: "anywhere",
              }}
            />

            {/* Media */}
            {slide.media && (
              <div
                className={`relative shrink-0 overflow-hidden rounded-[2.2cqw] ${isDark ? "bg-[#16181c]" : "bg-[#f0f0f0]"}`}
                style={{ marginTop: "4cqw", maxHeight: "48cqw" }}
              >
                {slide.media.kind === "image" && slide.media.dataUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imageRef}
                      data-media-image
                      src={slide.media.dataUrl}
                      alt=""
                      draggable={false}
                      className="block w-full select-none object-cover"
                      style={{
                        maxHeight: "48cqw",
                        objectPosition: `${slide.media.focalX ?? 50}% ${slide.media.focalY ?? 50}%`,
                      }}
                    />
                    {editable && onMediaFocalPointChange && (
                      <MediaFocalDrag
                        imageRef={imageRef}
                        focalX={slide.media.focalX ?? 50}
                        focalY={slide.media.focalY ?? 50}
                        onChange={onMediaFocalPointChange}
                      />
                    )}
                  </>
                )}
                {slide.media.kind === "video" && posterOverride && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={posterOverride}
                    alt=""
                    className="block w-full object-cover"
                    style={{ maxHeight: "48cqw" }}
                  />
                )}
                {slide.media.kind === "video" && !posterOverride && slide.media.objectUrl && (
                  <>
                    <video
                      ref={videoRef}
                      src={slide.media.objectUrl}
                      className="block w-full object-cover"
                      style={{
                        maxHeight: "48cqw",
                        objectPosition: `${slide.media.focalX ?? 50}% ${slide.media.focalY ?? 50}%`,
                      }}
                      muted
                      playsInline
                      loop
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div
                        className="flex items-center justify-center rounded-full bg-black/50"
                        style={{ width: "10cqw", height: "10cqw" }}
                      >
                        <PlayGlyph className="text-white" style={{ width: "5cqw", height: "5cqw" }} />
                      </div>
                    </div>
                  </>
                )}
                {slide.media.kind === "video" && slide.media.needsReattach && (
                  <div
                    className="flex items-center justify-center text-center opacity-70"
                    style={{ height: "30cqw", fontSize: "3cqw", padding: "3cqw" }}
                  >
                    Video needs to be re-attached after reload
                  </div>
                )}
              </div>
            )}

            {/* Timestamp — global, set once via the date/time picker, applies to every slide. */}
            <div
              className={`shrink-0 whitespace-nowrap ${isDark ? "text-[#71767b]" : "text-[#536471]"}`}
              style={{ fontSize: "3.1cqw", marginTop: "4cqw" }}
            >
              {timestampLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
