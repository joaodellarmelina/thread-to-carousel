"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { play } from "cuelume";
import { X, Download, Layers, Loader2 } from "lucide-react";
import JSZip from "jszip";
import { useAppStore } from "@/lib/store";
import { ASPECT_DIMENSIONS } from "@/lib/types";
import { TWEET_MAX_CHARS } from "@/lib/constants";
import { TweetCard } from "./tweet-card";
import { capturePosterFrame, domToPngBlob, downloadBlob, waitForVideoFrame } from "@/lib/export";
import { modalSpring, backdropFade } from "@/lib/motion";
import { trimToFit } from "@/lib/text-fit";

function slugify(text: string, fallback: string): string {
  const s = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return s || fallback;
}

function videoExtension(name: string): string {
  const match = name.match(/\.([a-z0-9]+)$/i);
  return match ? match[1] : "mp4";
}

export function ExportPanel({ onClose }: { onClose: () => void }) {
  const slides = useAppStore((s) => s.slides);
  const profile = useAppStore((s) => s.profile);
  const cardTheme = useAppStore((s) => s.cardTheme);
  const cardStyle = useAppStore((s) => s.cardStyle);
  const frameBackground = useAppStore((s) => s.frameBackground);
  const aspectRatio = useAppStore((s) => s.aspectRatio);
  const postDateTime = useAppStore((s) => s.postDateTime);
  const showXLogo = useAppStore((s) => s.showXLogo);
  const selectedSlideId = useAppStore((s) => s.selectedSlideId);
  const updateSlideText = useAppStore((s) => s.updateSlideText);

  const [busy, setBusy] = useState<"single" | "all" | null>(null);
  const [posterOverrides, setPosterOverrides] = useState<Record<string, string>>({});

  const cardNodes = useRef<Map<string, HTMLDivElement>>(new Map());
  const videoNodes = useRef<Map<string, HTMLVideoElement>>(new Map());

  const pixelWidth = ASPECT_DIMENSIONS[aspectRatio].width;

  /**
   * Safety net: a slide's text only gets trimmed to fit live while it's the one
   * being actively edited. If the aspect ratio/template changed globally and this
   * slide was never revisited, its stored text could still overflow — checked and
   * corrected here, right before it's captured, so an export can never clip text.
   */
  function ensureFits(slide: (typeof slides)[number], node: HTMLElement) {
    const body = node.querySelector<HTMLElement>("[data-tweet-body]");
    if (!body) return;
    const { text, trimmed } = trimToFit(body);
    if (trimmed) updateSlideText(slide.id, text);
  }

  async function capturePosters(targets: string[]) {
    const overrides: Record<string, string> = {};
    for (const id of targets) {
      const video = videoNodes.current.get(id);
      if (!video) continue;
      await waitForVideoFrame(video);
      overrides[id] = capturePosterFrame(video);
    }
    if (Object.keys(overrides).length > 0) {
      setPosterOverrides(overrides);
      // Let React commit the poster-image swap before we snapshot the DOM.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    return overrides;
  }

  async function exportCurrent() {
    const slide = slides.find((s) => s.id === selectedSlideId) ?? slides[0];
    if (!slide) return;
    setBusy("single");
    try {
      const needsVideo = slide.media?.kind === "video" && !!slide.media.objectUrl;
      if (needsVideo) await capturePosters([slide.id]);

      const node = cardNodes.current.get(slide.id);
      if (!node) throw new Error("Card not ready");
      ensureFits(slide, node);
      const pngBlob = await domToPngBlob(node, pixelWidth);
      const baseName = slugify(slide.text, "slide");

      if (needsVideo && slide.media?.objectUrl) {
        const zip = new JSZip();
        zip.file(`${baseName}.png`, pngBlob);
        const videoBlob = await fetch(slide.media.objectUrl).then((r) => r.blob());
        zip.file(`${baseName}-video.${videoExtension(slide.media.name)}`, videoBlob);
        const content = await zip.generateAsync({ type: "blob" });
        downloadBlob(content, `${baseName}.zip`);
      } else {
        downloadBlob(pngBlob, `${baseName}.png`);
      }
      play("success");
    } catch {
      play("error");
    } finally {
      setPosterOverrides({});
      setBusy(null);
    }
  }

  async function exportAll() {
    setBusy("all");
    try {
      const videoSlideIds = slides.filter((s) => s.media?.kind === "video" && s.media.objectUrl).map((s) => s.id);
      if (videoSlideIds.length > 0) await capturePosters(videoSlideIds);

      const zip = new JSZip();
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const node = cardNodes.current.get(slide.id);
        if (!node) continue;
        ensureFits(slide, node);
        const pngBlob = await domToPngBlob(node, pixelWidth);
        const baseName = `${String(i + 1).padStart(2, "0")}-${slugify(slide.text, "slide")}`;
        zip.file(`${baseName}.png`, pngBlob);
        if (slide.media?.kind === "video" && slide.media.objectUrl) {
          const videoBlob = await fetch(slide.media.objectUrl).then((r) => r.blob());
          zip.file(`${baseName}-video.${videoExtension(slide.media.name)}`, videoBlob);
        }
      }
      const content = await zip.generateAsync({ type: "blob" });
      downloadBlob(content, "carousel.zip");
      play("success");
    } catch {
      play("error");
    } finally {
      setPosterOverrides({});
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={backdropFade}
        onClick={() => !busy && onClose()}
        className="absolute inset-0 bg-black/70"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={modalSpring}
        className="modal-surface relative z-10 flex w-full max-w-sm flex-col gap-4 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold lowercase">export carousel</h2>
          <button
            data-cuelume-press
            disabled={!!busy}
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--app-fg-muted)] transition-transform hover:text-[var(--app-fg)] active:scale-90 disabled:opacity-40"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-[var(--app-fg-muted)] lowercase">
          slides export as {ASPECT_DIMENSIONS[aspectRatio].width}×{ASPECT_DIMENSIONS[aspectRatio].height}px pngs, ready
          for instagram.
        </p>

        <button
          data-cuelume-press
          data-cuelume-release
          onClick={exportAll}
          disabled={!!busy}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--app-accent)] px-4 py-2.5 text-sm font-medium text-white transition-transform active:scale-[0.97] disabled:opacity-60"
        >
          {busy === "all" ? <Loader2 size={15} className="animate-spin" /> : <Layers size={15} />}
          <span className="lowercase">export all ({slides.length}) as zip</span>
        </button>
        <button
          data-cuelume-press
          data-cuelume-release
          onClick={exportCurrent}
          disabled={!!busy}
          className="material inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-transform active:scale-[0.97] disabled:opacity-60"
        >
          {busy === "single" ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          <span className="lowercase">export current slide</span>
        </button>
      </motion.div>

      {/* Off-screen high-fidelity render rig used for capture */}
      <div style={{ position: "fixed", left: -9999, top: 0, width: 480 }} aria-hidden="true">
        {slides.map((slide) => (
          <div key={slide.id} style={{ width: 480, marginBottom: 24 }}>
            <TweetCard
              ref={(el) => {
                if (el) cardNodes.current.set(slide.id, el);
              }}
              slide={slide}
              profile={profile}
              theme={cardTheme}
              cardStyle={cardStyle}
              frameBackground={frameBackground}
              aspectRatio={aspectRatio}
              postDateTime={postDateTime}
              maxChars={TWEET_MAX_CHARS}
              showXLogo={showXLogo}
              posterOverride={posterOverrides[slide.id]}
              videoRef={(el) => {
                if (el) videoNodes.current.set(slide.id, el);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
