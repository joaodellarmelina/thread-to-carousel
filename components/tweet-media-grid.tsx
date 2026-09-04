"use client";

import { useRef } from "react";
import type { MediaAsset, MediaLayout } from "@/lib/types";
import { PlayGlyph } from "./icons";
import { MediaFocalDrag } from "./media-focal-drag";

function MediaTile({
  media,
  editable,
  posterOverride,
  onFocalPointChange,
  videoRef,
  className,
}: {
  media: MediaAsset;
  editable: boolean;
  posterOverride?: string;
  onFocalPointChange?: (mediaId: string, point: { x: number; y: number }) => void;
  videoRef?: (mediaId: string, element: HTMLVideoElement | null) => void;
  className?: string;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const position = `${media.focalX ?? 50}% ${media.focalY ?? 50}%`;
  const isVideo = media.kind === "video";

  return (
    <div className={`relative min-h-0 min-w-0 overflow-hidden bg-[#16181c] ${className ?? ""}`}>
      {isVideo && posterOverride ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={posterOverride} alt="" className="h-full w-full object-cover" style={{ objectPosition: position }} />
      ) : isVideo && media.src ? (
        <video ref={(element) => videoRef?.(media.id, element)} src={media.src} className="h-full w-full object-cover" style={{ objectPosition: position }} muted playsInline loop />
      ) : media.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={imageRef} data-media-image src={media.src} alt="" draggable={false} className="h-full w-full select-none object-cover" style={{ objectPosition: position }} />
      ) : (
        <div className="flex h-full items-center justify-center text-[2.5cqw] text-white/40">media unavailable</div>
      )}

      {isVideo && media.src && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex items-center justify-center rounded-full bg-black/55" style={{ width: "9cqw", height: "9cqw" }}>
            <PlayGlyph className="text-white" style={{ width: "4.5cqw", height: "4.5cqw" }} />
          </div>
        </div>
      )}

      {!isVideo && editable && media.src && onFocalPointChange && (
        <MediaFocalDrag
          imageRef={imageRef}
          focalX={media.focalX ?? 50}
          focalY={media.focalY ?? 50}
          onChange={(point) => onFocalPointChange(media.id, point)}
        />
      )}
    </div>
  );
}

export function TweetMediaGrid({
  media,
  layout,
  editable = false,
  posterOverrides,
  onFocalPointChange,
  videoRef,
}: {
  media: MediaAsset[];
  layout: MediaLayout;
  editable?: boolean;
  posterOverrides?: Record<string, string>;
  onFocalPointChange?: (mediaId: string, point: { x: number; y: number }) => void;
  videoRef?: (mediaId: string, element: HTMLVideoElement | null) => void;
}) {
  if (!media.length) return null;
  const count = Math.min(media.length, 4);
  const vertical = layout === "vertical" && count > 1;
  const fallbackHeight = vertical ? 48 : count === 1 ? 43 : count === 2 ? 42 : 44;

  return (
    <div
      data-media-grid
      className="grid shrink-0 gap-[0.35cqw] overflow-hidden rounded-[2.8cqw] border border-white/10"
      style={
        vertical
          ? { gridTemplateRows: `repeat(${count}, minmax(0, 1fr))`, height: `var(--tweet-media-height, ${fallbackHeight}cqw)` }
          : count === 1
            ? { gridTemplateColumns: "1fr", height: `var(--tweet-media-height, ${fallbackHeight}cqw)` }
            : count === 2
              ? { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", height: `var(--tweet-media-height, ${fallbackHeight}cqw)` }
              : { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gridTemplateRows: "repeat(2, minmax(0, 1fr))", height: `var(--tweet-media-height, ${fallbackHeight}cqw)` }
      }
    >
      {media.slice(0, 4).map((item, index) => (
        <MediaTile
          key={item.id}
          media={item}
          editable={editable}
          posterOverride={posterOverrides?.[item.id]}
          onFocalPointChange={onFocalPointChange}
          videoRef={videoRef}
          className={!vertical && count === 3 && index === 0 ? "row-span-2" : undefined}
        />
      ))}
    </div>
  );
}
