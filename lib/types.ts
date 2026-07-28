export type MediaKind = "image" | "video";

export interface SlideMedia {
  kind: MediaKind;
  /** Persistable for images (data URL). Never set for video. */
  dataUrl?: string;
  /** In-memory only, recreated per session, never persisted for video. */
  objectUrl?: string;
  name: string;
  /** True once a video's objectUrl has been lost (e.g. after a reload) and needs re-attaching. */
  needsReattach?: boolean;
  /** object-position percentages (0-100), default 50/50 = center — which part of the crop is visible. */
  focalX?: number;
  focalY?: number;
}

export interface Slide {
  id: string;
  text: string;
  media?: SlideMedia;
}

/** "datetime-local" input format (no seconds/timezone) — kept local, no conversion needed. */
export const DEFAULT_POST_DATETIME = "2023-06-07T10:39";

export interface Profile {
  name: string;
  handle: string;
  avatarDataUrl?: string;
  verified: boolean;
}

export type CardTheme = "dark" | "light";
export type AspectRatio = "4:5" | "1:1";
/** "framed" = rounded card inset on a customizable background color. "square" = edge-to-edge, sharp corners. */
export type CardStyle = "framed" | "square";

export const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
};
