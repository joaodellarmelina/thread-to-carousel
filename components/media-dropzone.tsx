"use client";

import { useRef, useState } from "react";
import { play } from "cuelume";
import { AlertCircle, ArrowLeft, ArrowRight, Grid2X2, Images, Plus, Rows3, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { prepareImage } from "@/lib/image";
import { saveMediaBlob } from "@/lib/media-db";
import { makeId } from "@/lib/id";
import type { MediaAsset } from "@/lib/types";

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

async function getVideoDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve({ width: video.videoWidth, height: video.videoHeight });
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    video.src = url;
  });
}

export function MediaDropzone({ slideId, media }: { slideId: string; media: MediaAsset[] }) {
  const addMedia = useAppStore((s) => s.addMedia);
  const removeMedia = useAppStore((s) => s.removeMedia);
  const reorderMedia = useAppStore((s) => s.reorderMedia);
  const setMediaLayout = useAppStore((s) => s.setMediaLayout);
  const mediaLayout = useAppStore((s) => s.slides.find((slide) => slide.id === slideId)?.mediaLayout ?? "grid");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function prepareFile(file: File): Promise<MediaAsset> {
    const id = makeId();
    if (ACCEPTED_IMAGE_TYPES.has(file.type)) {
      const prepared = await prepareImage(file, 2160);
      await saveMediaBlob(id, prepared.blob);
      return {
        id,
        storageId: id,
        kind: file.type === "image/gif" ? "gif" : "image",
        src: URL.createObjectURL(prepared.blob),
        name: file.name,
        width: prepared.width,
        height: prepared.height,
        focalX: 50,
        focalY: 50,
      };
    }
    if (file.type.startsWith("video/")) {
      if (file.size > MAX_VIDEO_BYTES) throw new Error("videos can be up to 80 MB");
      const dimensions = await getVideoDimensions(file);
      await saveMediaBlob(id, file);
      return {
        id,
        storageId: id,
        kind: "video",
        src: URL.createObjectURL(file),
        name: file.name,
        width: dimensions.width,
        height: dimensions.height,
        focalX: 50,
        focalY: 50,
      };
    }
    throw new Error("use PNG, JPG, WebP, GIF, or a video file");
  }

  async function handleFiles(files: FileList | File[]) {
    const available = 4 - media.length;
    if (available <= 0) {
      setError("a post can have up to 4 media items");
      return;
    }
    const selected = Array.from(files).slice(0, available);
    if (!selected.length) return;
    setBusy(true);
    setError(null);
    try {
      const assets = await Promise.all(selected.map(prepareFile));
      addMedia(slideId, assets);
      play("success");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "could not attach media");
      play("error");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        void handleFiles(event.dataTransfer.files);
      }}
      className={`material flex flex-col gap-3 rounded-xl p-3 transition-colors ${
        isOver ? "border-[var(--app-accent)]/60 bg-[var(--app-accent)]/10" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[var(--app-fg-muted)]">
          <Images size={14} />
          <span className="lowercase">media · {media.length}/4</span>
        </div>
        <div className="flex items-center gap-1">
          {media.length > 1 && (
            <>
              <button onClick={() => setMediaLayout(slideId, "grid")} className={`rounded-md p-1.5 ${mediaLayout === "grid" ? "bg-white/15 text-white" : "text-[var(--app-fg-muted)]"}`} title="x-style grid">
                <Grid2X2 size={13} />
              </button>
              <button onClick={() => setMediaLayout(slideId, "vertical")} className={`rounded-md p-1.5 ${mediaLayout === "vertical" ? "bg-white/15 text-white" : "text-[var(--app-fg-muted)]"}`} title="vertical stack">
                <Rows3 size={13} />
              </button>
            </>
          )}
          <button data-cuelume-press onClick={() => inputRef.current?.click()} disabled={busy || media.length >= 4} className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1.5 text-xs font-medium disabled:opacity-40">
            <Plus size={12} />
            <span className="lowercase">{busy ? "adding…" : "add"}</span>
          </button>
        </div>
      </div>

      {media.length === 0 ? (
        <button onClick={() => inputRef.current?.click()} className="rounded-lg border border-dashed border-white/15 px-3 py-5 text-xs text-[var(--app-fg-muted)] transition-colors hover:border-white/30 hover:text-white">
          drag up to four photos, GIFs, or videos here
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {media.map((item, index) => (
            <div key={item.id} className="flex min-w-0 items-center gap-2 rounded-lg bg-black/25 p-1.5">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-black/40">
                {item.kind === "video" ? (
                  <video src={item.src} className="h-full w-full object-cover" muted />
                ) : item.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.src} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[10px] text-white/75">{item.name}</span>
                <div className="flex items-center gap-0.5 text-[var(--app-fg-muted)]">
                  <button disabled={index === 0} onClick={() => reorderMedia(slideId, item.id, -1)} className="p-1 disabled:opacity-20" title="move left"><ArrowLeft size={11} /></button>
                  <button disabled={index === media.length - 1} onClick={() => reorderMedia(slideId, item.id, 1)} className="p-1 disabled:opacity-20" title="move right"><ArrowRight size={11} /></button>
                  <button onClick={() => removeMedia(slideId, item.id)} className="ml-auto p-1 hover:text-red-400" title="remove"><Trash2 size={11} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="flex items-center gap-1.5 text-xs text-amber-400"><AlertCircle size={13} /><span className="lowercase">{error}</span></div>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/*" multiple className="hidden" onChange={(event) => event.target.files && void handleFiles(event.target.files)} />
    </div>
  );
}
