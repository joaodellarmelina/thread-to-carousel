"use client";

import { forwardRef, useRef } from "react";
import { BarChart3, Bookmark, Heart, MessageCircle, Repeat2 } from "lucide-react";
import type { Slide, CardTheme, CardStyle, AspectRatio } from "@/lib/types";
import { ASPECT_DIMENSIONS } from "@/lib/types";
import { formatPostDateTime } from "@/lib/date";
import { editorPlainText, plainTextToHtml, sanitizeRichText } from "@/lib/rich-text";
import { countCharacters, truncateCharacters } from "@/lib/characters";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import { XLogo, VerifiedBadge } from "./icons";
import { TweetMediaGrid } from "./tweet-media-grid";

interface TweetCardProps {
  slide: Slide;
  theme: CardTheme;
  cardStyle: CardStyle;
  frameBackground: string;
  aspectRatio: AspectRatio;
  /** Stable composition limit. It is intentionally independent of visual wrapping. */
  maxChars: number;
  editable?: boolean;
  onContentChange?: (text: string, richText: string) => void;
  onMediaFocalPointChange?: (mediaId: string, point: { x: number; y: number }) => void;
  videoRef?: (mediaId: string, element: HTMLVideoElement | null) => void;
  /** Replaces videos with decoded still frames while capturing exports. */
  posterOverrides?: Record<string, string>;
}

function Metric({ icon, value }: { icon: React.ReactElement; value: string }) {
  return (
    <div className="flex items-center gap-[1cqw] whitespace-nowrap">
      <span className="[&>svg]:h-[3.2cqw] [&>svg]:w-[3.2cqw]">{icon}</span>
      <span>{value}</span>
    </div>
  );
}

export const TweetCard = forwardRef<HTMLDivElement, TweetCardProps>(function TweetCard(
  {
    slide,
    theme,
    cardStyle,
    frameBackground,
    aspectRatio,
    maxChars,
    editable = false,
    onContentChange,
    onMediaFocalPointChange,
    videoRef,
    posterOverrides,
  },
  ref
) {
  const textRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dims = ASPECT_DIMENSIONS[aspectRatio];
  const isDark = theme === "dark";
  const isFramed = cardStyle === "framed";
  const cardBg = isDark ? "#000000" : "#ffffff";
  const timestampLabel = formatPostDateTime(slide.postDateTime);
  const profile = slide.profile;

  function commitEditorContent(el: HTMLDivElement) {
    let text = editorPlainText(el);
    if (countCharacters(text) > maxChars) {
      text = truncateCharacters(text, maxChars);
      el.textContent = text;
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    onContentChange?.(text, sanitizeRichText(el.innerHTML));
  }

  // Layout effect (not a passive one) — commits before paint, so a parent
  // measuring this synced text (see TextFitProbe) never sees a stale frame.
  useIsomorphicLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    // Don't clobber the live cursor position while this instance is being typed into.
    if (editable && document.activeElement === el) return;
    const nextHtml = sanitizeRichText(slide.richText ?? plainTextToHtml(slide.text));
    if (el.innerHTML !== nextHtml) {
      el.innerHTML = nextHtml;
    }
  }, [slide.id, slide.text, slide.richText, editable]);

  // A fixed social canvas cannot grow like a real post. Preserve the complete
  // post by reclaiming media height first, then gently reducing type until the
  // body fits. This is layout-only: the stored text and 280-char counter never
  // change as words wrap.
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const body = textRef.current;
    if (!root || !body) return;

    const defaultMediaHeight =
      slide.mediaLayout === "vertical" && slide.media.length > 1
        ? 48
        : slide.media.length === 1
          ? 43
          : slide.media.length === 2
            ? 42
            : 44;
    const minMediaHeight = aspectRatio === "1:1" ? 16 : aspectRatio === "4:5" ? 22 : 30;
    const minFontSize = aspectRatio === "1:1" ? 2.8 : 3.2;
    let mediaHeight = defaultMediaHeight;
    let fontSize = 4.4;

    root.style.setProperty("--tweet-media-height", `${mediaHeight}cqw`);
    root.style.setProperty("--tweet-font-size", `${fontSize}cqw`);

    const overflows = () => body.scrollHeight > body.clientHeight + 1;

    while (slide.media.length > 0 && overflows() && mediaHeight > minMediaHeight) {
      mediaHeight = Math.max(minMediaHeight, mediaHeight - 1);
      root.style.setProperty("--tweet-media-height", `${mediaHeight}cqw`);
    }
    while (overflows() && fontSize > minFontSize) {
      fontSize = Math.max(minFontSize, fontSize - 0.1);
      root.style.setProperty("--tweet-font-size", `${fontSize.toFixed(1)}cqw`);
    }
  }, [
    slide.text,
    slide.richText,
    slide.media,
    slide.mediaLayout,
    slide.display,
    slide.postDateTime,
    aspectRatio,
    cardStyle,
  ]);

  return (
    <div
      ref={(node) => {
        rootRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
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
              {slide.display.showXLogo && <XLogo className="shrink-0" style={{ width: "5.5cqw", height: "5.5cqw" }} />}
            </div>

            {/* Body text */}
            <div
              ref={textRef}
              data-tweet-body
              data-live-editor={editable ? slide.id : undefined}
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
                if (countCharacters(editorPlainText(el)) >= maxChars) return;
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
                commitEditorContent(el);
              }}
              onPaste={(e) => {
                if (!editable) return;
                e.preventDefault();
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) return;
                const range = selection.getRangeAt(0);
                range.deleteContents();
                const pasted = document.createTextNode(e.clipboardData.getData("text/plain"));
                range.insertNode(pasted);
                range.setStartAfter(pasted);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                const el = e.currentTarget;
                commitEditorContent(el);
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                commitEditorContent(el);
              }}
              className={`min-h-0 min-w-0 flex-1 overflow-hidden whitespace-pre-wrap outline-none ${editable ? "cursor-text" : ""}`}
              style={{
                fontSize: "var(--tweet-font-size, 4.4cqw)",
                lineHeight: 1.35,
                letterSpacing: "-0.005em",
                // A long unbroken run (no spaces — a URL, or just mashing the keyboard)
                // must still wrap instead of overflowing the fixed-size card.
                overflowWrap: "anywhere",
              }}
            />

            {/* Media */}
            {slide.media.length > 0 && (
              <div style={{ marginTop: "4cqw" }}>
                <TweetMediaGrid media={slide.media} layout={slide.mediaLayout} editable={editable} posterOverrides={posterOverrides} onFocalPointChange={onMediaFocalPointChange} videoRef={videoRef} />
              </div>
            )}

            {/* Post-specific timestamp and engagement metadata. */}
            {slide.display.showDate && (
              <div className={`shrink-0 whitespace-nowrap ${isDark ? "text-[#71767b]" : "text-[#536471]"}`} style={{ fontSize: "3.1cqw", marginTop: "4cqw" }}>
                {timestampLabel}
              </div>
            )}

            {slide.display.showMetrics && (
              <div className={`grid shrink-0 grid-cols-5 border-t ${isDark ? "border-white/10 text-[#71767b]" : "border-black/10 text-[#536471]"}`} style={{ marginTop: "3.2cqw", paddingTop: "2.8cqw", fontSize: "2.65cqw" }}>
                <Metric icon={<MessageCircle />} value={slide.metrics.replies} />
                <Metric icon={<Repeat2 />} value={slide.metrics.reposts} />
                <Metric icon={<Heart />} value={slide.metrics.likes} />
                <Metric icon={<Bookmark />} value={slide.metrics.bookmarks} />
                {slide.display.showViews ? <Metric icon={<BarChart3 />} value={slide.metrics.views} /> : <span />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
