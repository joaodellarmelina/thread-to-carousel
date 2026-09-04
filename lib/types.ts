export type MediaKind = "image" | "gif" | "video";
export type MediaLayout = "grid" | "vertical";

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  /** Runtime URL. Blob URLs are rebuilt from IndexedDB after a reload. */
  src?: string;
  storageId: string;
  name: string;
  width?: number;
  height?: number;
  focalX?: number;
  focalY?: number;
}

export interface PostMetrics {
  replies: string;
  reposts: string;
  likes: string;
  bookmarks: string;
  views: string;
}

export interface PostDisplay {
  showMetrics: boolean;
  showViews: boolean;
  showDate: boolean;
  showXLogo: boolean;
  showSlideNumber: boolean;
}

export interface Slide {
  id: string;
  text: string;
  /** Sanitized inline HTML. Plain text remains the source for limits and filenames. */
  richText?: string;
  profile: Profile;
  postDateTime: string;
  metrics: PostMetrics;
  display: PostDisplay;
  media: MediaAsset[];
  mediaLayout: MediaLayout;
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
export type AspectRatio = "4:5" | "1:1" | "9:16";
/** "framed" = rounded card inset on a customizable background color. "square" = edge-to-edge, sharp corners. */
export type CardStyle = "framed" | "square";

export const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
};
