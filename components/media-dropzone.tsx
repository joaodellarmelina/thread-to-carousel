"use client";

import { useEffect, useRef, useState } from "react";
import { play } from "cuelume";
import { Image as ImageIcon, Video, X as XIcon, AlertCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { compressImageToDataUrl } from "@/lib/image";
import type { SlideMedia } from "@/lib/types";

const VIDEO_UNSUPPORTED_MESSAGE = "video support isn't available yet. it's coming in a future update.";

export function MediaDropzone({ slideId, media }: { slideId: string; media?: SlideMedia }) {
  const attachMedia = useAppStore((s) => s.attachMedia);
  const clearMedia = useAppStore((s) => s.clearMedia);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    if (file.type.startsWith("image/")) {
      setError(null);
      const dataUrl = await compressImageToDataUrl(file, 1440);
      attachMedia(slideId, { kind: "image", dataUrl, name: file.name });
      play("success");
    } else if (file.type.startsWith("video/")) {
      setError(VIDEO_UNSUPPORTED_MESSAGE);
      play("error");
    } else {
      setError(null);
      play("error");
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      className={`material flex items-center justify-between gap-3 rounded-xl p-3 transition-colors ${
        isOver ? "border-[var(--app-accent)]/60 bg-[var(--app-accent)]/10" : ""
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-[var(--app-fg-muted)]">
        {error ? (
          <>
            <AlertCircle size={14} className="shrink-0 text-amber-400" />
            <span className="text-amber-400 lowercase">{error}</span>
          </>
        ) : media ? (
          <>
            {media.kind === "image" ? <ImageIcon size={14} /> : <Video size={14} />}
            <span className="max-w-[9rem] truncate">{media.name}</span>
          </>
        ) : (
          <span className="lowercase">drag an image onto this card, or</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          data-cuelume-press
          data-cuelume-hover="tick"
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium transition-[background-color,transform] hover:bg-white/15 active:scale-[0.97]"
        >
          <span className="lowercase">{media ? "replace" : "attach"}</span>
        </button>
        {media && (
          <button
            data-cuelume-press
            onClick={() => clearMedia(slideId)}
            className="rounded-full bg-white/10 p-1.5 transition-[background-color,transform] hover:bg-white/15 active:scale-90"
            title="remove media"
          >
            <XIcon size={13} />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
