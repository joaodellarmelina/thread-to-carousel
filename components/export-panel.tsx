"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { play } from "cuelume";
import { AlertCircle, X, Download, Film, Layers, Loader2 } from "lucide-react";
import JSZip from "jszip";
import { useAppStore } from "@/lib/store";
import { ASPECT_DIMENSIONS } from "@/lib/types";
import { TWEET_MAX_CHARS } from "@/lib/constants";
import { TweetCard } from "./tweet-card";
import { capturePosterFrame, domToPngBlob, downloadBlob, waitForVideoFrame } from "@/lib/export";
import { renderTweetVideo, type VideoOverlay } from "@/lib/video-export";
import { modalSpring, backdropFade } from "@/lib/motion";

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
  const cardTheme = useAppStore((s) => s.cardTheme);
  const cardStyle = useAppStore((s) => s.cardStyle);
  const frameBackground = useAppStore((s) => s.frameBackground);
  const aspectRatio = useAppStore((s) => s.aspectRatio);
  const selectedSlideId = useAppStore((s) => s.selectedSlideId);

  const [busy, setBusy] = useState<"single" | "all" | "video" | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [posterOverrides, setPosterOverrides] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const cardNodes = useRef<Map<string, HTMLDivElement>>(new Map());
  const videoNodes = useRef<Map<string, HTMLVideoElement>>(new Map());

  const pixelWidth = ASPECT_DIMENSIONS[aspectRatio].width;
  const selectedSlide = slides.find((slide) => slide.id === selectedSlideId) ?? slides[0];
  const selectedSlideHasVideo = !!selectedSlide?.media.some((media) => media.kind === "video" && media.src);

  async function capturePosters(targets: string[]) {
    const overrides: Record<string, string> = {};
    const targetIds = new Set(targets);
    for (const slide of slides) {
      if (!targetIds.has(slide.id)) continue;
      for (const media of slide.media) {
        if (media.kind !== "video") continue;
        const video = videoNodes.current.get(media.id);
        if (!video) continue;
        try {
          await waitForVideoFrame(video);
          if (video.readyState >= 2) overrides[media.id] = capturePosterFrame(video);
        } catch {
          // A video codec may be previewable but not canvas-decodable. Its
          // original file still belongs in the ZIP, so don't abort the batch.
        }
      }
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
    setError(null);
    try {
      const needsVideo = slide.media.some((media) => media.kind === "video" && !!media.src);
      if (needsVideo) await capturePosters([slide.id]);

      const node = cardNodes.current.get(slide.id);
      if (!node) throw new Error("Card not ready");
      const pngBlob = await domToPngBlob(node, pixelWidth);
      const baseName = slugify(slide.text, "slide");

      if (needsVideo) {
        const zip = new JSZip();
        zip.file(`${baseName}.png`, pngBlob);
        const videos = slide.media.filter((media) => media.kind === "video" && media.src);
        for (let index = 0; index < videos.length; index++) {
          const video = videos[index];
          const videoBlob = await fetch(video.src!).then((r) => r.blob());
          zip.file(`${baseName}-video-${index + 1}.${videoExtension(video.name)}`, videoBlob);
        }
        const content = await zip.generateAsync({ type: "blob" });
        downloadBlob(content, `${baseName}.zip`);
      } else {
        downloadBlob(pngBlob, `${baseName}.png`);
      }
      play("success");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not export this slide.");
      play("error");
    } finally {
      setPosterOverrides({});
      setBusy(null);
    }
  }

  async function exportAll() {
    setBusy("all");
    setError(null);
    try {
      const videoSlideIds = slides.filter((s) => s.media.some((media) => media.kind === "video" && media.src)).map((s) => s.id);
      if (videoSlideIds.length > 0) await capturePosters(videoSlideIds);

      const zip = new JSZip();
      let capturedSlides = 0;
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const node = cardNodes.current.get(slide.id);
        if (!node) continue;
        let pngBlob: Blob;
        try {
          pngBlob = await domToPngBlob(node, pixelWidth);
        } catch (cause) {
          const detail = cause instanceof Error && cause.message ? `: ${cause.message}` : "";
          throw new Error(`Slide ${i + 1} could not be rendered${detail}`);
        }
        capturedSlides += 1;
        const baseName = `${String(i + 1).padStart(2, "0")}-${slugify(slide.text, "slide")}`;
        zip.file(`${baseName}.png`, pngBlob);
        const videos = slide.media.filter((media) => media.kind === "video" && media.src);
        for (let videoIndex = 0; videoIndex < videos.length; videoIndex++) {
          const video = videos[videoIndex];
          try {
            const videoBlob = await fetch(video.src!).then((r) => r.blob());
            zip.file(`${baseName}-video-${videoIndex + 1}.${videoExtension(video.name)}`, videoBlob);
          } catch {
            // The PNG carousel remains useful even if an optional source video
            // cannot be copied into the archive.
          }
        }
      }
      if (capturedSlides === 0) throw new Error("No slides were ready to export.");
      const content = await zip.generateAsync({ type: "blob" });
      downloadBlob(content, "carousel.zip");
      play("success");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the ZIP.");
      play("error");
    } finally {
      setPosterOverrides({});
      setBusy(null);
    }
  }

  async function exportVideo() {
    const slide = selectedSlide;
    if (!slide) return;
    setBusy("video");
    setVideoProgress(0);
    setError(null);
    try {
      await capturePosters([slide.id]);
      const node = cardNodes.current.get(slide.id);
      if (!node) throw new Error("Card not ready");

      const cardRect = node.getBoundingClientRect();
      const overlays: VideoOverlay[] = slide.media
        .filter((media) => media.kind === "video" && media.src)
        .flatMap((media) => {
          const tile = Array.from(node.querySelectorAll<HTMLElement>("[data-media-id]")).find(
            (element) => element.dataset.mediaId === media.id
          );
          if (!tile) return [];
          const rect = tile.getBoundingClientRect();
          return [{
            media,
            rect: {
              x: rect.left - cardRect.left,
              y: rect.top - cardRect.top,
              width: rect.width,
              height: rect.height,
            },
          }];
        });
      if (!overlays.length) throw new Error("The attached video is not ready yet.");

      const poster = await domToPngBlob(node, pixelWidth);
      const dimensions = ASPECT_DIMENSIONS[aspectRatio];
      const video = await renderTweetVideo({
        poster,
        width: dimensions.width,
        height: dimensions.height,
        sourceWidth: cardRect.width,
        overlays,
        onProgress: setVideoProgress,
      });
      downloadBlob(video, `${slugify(slide.text, "post")}.mp4`);
      play("success");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not export this MP4.");
      play("error");
    } finally {
      setPosterOverrides({});
      setBusy(null);
      setVideoProgress(0);
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
          export png carousels or turn the selected post&apos;s attached video into an instagram-ready mp4.
        </p>

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
          onClick={exportVideo}
          disabled={!!busy || !selectedSlideHasVideo}
          title={selectedSlideHasVideo ? "export selected post as MP4" : "add a video to the selected post first"}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--app-accent)]/15 px-4 py-2.5 text-sm font-medium text-[var(--app-accent)] transition-transform active:scale-[0.97] disabled:opacity-40"
        >
          {busy === "video" ? <Loader2 size={15} className="animate-spin" /> : <Film size={15} />}
          <span className="lowercase">
            {busy === "video" ? `rendering mp4 ${Math.round(videoProgress * 100)}%` : "export selected video as mp4"}
          </span>
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
              theme={cardTheme}
              cardStyle={cardStyle}
              frameBackground={frameBackground}
              aspectRatio={aspectRatio}
              maxChars={TWEET_MAX_CHARS}
              posterOverrides={posterOverrides}
              videoRef={(mediaId, el) => {
                if (el) videoNodes.current.set(mediaId, el);
                else videoNodes.current.delete(mediaId);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
