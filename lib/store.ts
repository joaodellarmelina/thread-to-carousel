import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { makeId } from "./id";
import { parseThread } from "./parse-thread";
import { TWEET_MAX_CHARS } from "./constants";
import { truncateCharacters } from "./characters";
import { DEFAULT_POST_DATETIME } from "./types";
import { loadMediaBlob } from "./media-db";
import type {
  AspectRatio,
  CardStyle,
  CardTheme,
  MediaAsset,
  MediaLayout,
  PostDisplay,
  PostMetrics,
  Profile,
  Slide,
} from "./types";

// Binary slide media lives in IndexedDB; localStorage only holds the small,
// serializable project model (plus compact profile avatars). A failed write
// should never crash the editor.
const safeLocalStorage: StateStorage = {
  getItem: (name) => (typeof window === "undefined" ? null : localStorage.getItem(name)),
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (err) {
      console.warn("[x-carrousel] Could not save to localStorage (quota exceeded?). This change won't persist across reloads.", err);
    }
  },
  removeItem: (name) => localStorage.removeItem(name),
};

interface AppState {
  slides: Slide[];
  selectedSlideId: string | null;
  profile: Profile;
  cardTheme: CardTheme;
  cardStyle: CardStyle;
  frameBackground: string;
  aspectRatio: AspectRatio;
  soundEnabled: boolean;
  profileIntroShown: boolean;
  addSlide: (text?: string) => string;
  removeSlide: (id: string) => void;
  duplicateSlide: (id: string) => void;
  updateSlideText: (id: string, text: string) => void;
  updateSlideContent: (id: string, text: string, richText: string) => void;
  reorderSlides: (fromId: string, toId: string) => void;
  selectSlide: (id: string | null) => void;
  addMedia: (id: string, media: MediaAsset[]) => void;
  removeMedia: (id: string, mediaId: string) => void;
  reorderMedia: (id: string, mediaId: string, direction: -1 | 1) => void;
  setMediaLayout: (id: string, layout: MediaLayout) => void;
  setMediaFocalPoint: (id: string, mediaId: string, x: number, y: number) => void;
  importThread: (raw: string) => void;
  updateSlideProfile: (id: string, profile: Partial<Profile>) => void;
  updateSlideDateTime: (id: string, value: string) => void;
  updateSlideMetrics: (id: string, metrics: Partial<PostMetrics>) => void;
  updateSlideDisplay: (id: string, display: Partial<PostDisplay>) => void;
  applyProfileToAll: (sourceId: string) => void;
  hydrateMedia: () => Promise<void>;
  setCardTheme: (theme: CardTheme) => void;
  setCardStyle: (style: CardStyle) => void;
  setFrameBackground: (background: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setSoundEnabled: (enabled: boolean) => void;
  markProfileIntroShown: () => void;
  reset: () => void;
}

const defaultProfile: Profile = {
  name: "Your Name",
  handle: "yourhandle",
  verified: true,
};

const defaultMetrics: PostMetrics = {
  replies: "24",
  reposts: "108",
  likes: "1.2K",
  bookmarks: "86",
  views: "48K",
};

const defaultDisplay: PostDisplay = {
  showMetrics: true,
  showViews: true,
  showDate: true,
  showXLogo: true,
  showSlideNumber: false,
};

function emptySlide(text = "", profile = defaultProfile): Slide {
  return {
    id: makeId(),
    text,
    profile: { ...profile },
    postDateTime: DEFAULT_POST_DATETIME,
    metrics: { ...defaultMetrics },
    display: { ...defaultDisplay },
    media: [],
    mediaLayout: "grid",
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      slides: [],
      selectedSlideId: null,
      profile: defaultProfile,
      cardTheme: "dark",
      cardStyle: "square",
      frameBackground: "linear-gradient(135deg, #7c3aed, #db2777)",
      aspectRatio: "4:5",
      soundEnabled: true,
      profileIntroShown: false,
      addSlide: (text = "") => {
        const current = get().slides.find((s) => s.id === get().selectedSlideId);
        const slide = emptySlide(text, current?.profile ?? get().profile);
        set((state) => ({
          slides: [...state.slides, slide],
          selectedSlideId: slide.id,
        }));
        return slide.id;
      },

      removeSlide: (id) => {
        set((state) => {
          const slides = state.slides.filter((s) => s.id !== id);
          const wasSelected = state.selectedSlideId === id;
          const idx = state.slides.findIndex((s) => s.id === id);
          const nextSelected = wasSelected
            ? (slides[idx] ?? slides[idx - 1] ?? slides[0])?.id ?? null
            : state.selectedSlideId;
          return { slides, selectedSlideId: nextSelected };
        });
      },

      duplicateSlide: (id) => {
        set((state) => {
          const idx = state.slides.findIndex((s) => s.id === id);
          if (idx === -1) return state;
          const copy: Slide = { ...state.slides[idx], id: makeId() };
          const slides = [...state.slides];
          slides.splice(idx + 1, 0, copy);
          return { slides, selectedSlideId: copy.id };
        });
      },

      updateSlideText: (id, text) => {
        set((state) => ({
          slides: state.slides.map((s) => (s.id === id ? { ...s, text, richText: undefined } : s)),
        }));
      },

      updateSlideContent: (id, text, richText) => {
        set((state) => ({
          slides: state.slides.map((s) => (s.id === id ? { ...s, text, richText } : s)),
        }));
      },

      reorderSlides: (fromId, toId) => {
        set((state) => {
          const slides = [...state.slides];
          const fromIdx = slides.findIndex((s) => s.id === fromId);
          const toIdx = slides.findIndex((s) => s.id === toId);
          if (fromIdx === -1 || toIdx === -1) return state;
          const [moved] = slides.splice(fromIdx, 1);
          slides.splice(toIdx, 0, moved);
          return { slides };
        });
      },

      selectSlide: (id) => set({ selectedSlideId: id }),

      addMedia: (id, media) => {
        set((state) => ({
          slides: state.slides.map((s) =>
            s.id === id ? { ...s, media: [...s.media, ...media].slice(0, 4) } : s
          ),
        }));
      },

      removeMedia: (id, mediaId) => {
        set((state) => ({
          slides: state.slides.map((s) =>
            s.id === id ? { ...s, media: s.media.filter((item) => item.id !== mediaId) } : s
          ),
        }));
      },

      reorderMedia: (id, mediaId, direction) => {
        set((state) => ({
          slides: state.slides.map((s) => {
            if (s.id !== id) return s;
            const from = s.media.findIndex((item) => item.id === mediaId);
            const to = from + direction;
            if (from < 0 || to < 0 || to >= s.media.length) return s;
            const media = [...s.media];
            [media[from], media[to]] = [media[to], media[from]];
            return { ...s, media };
          }),
        }));
      },

      setMediaLayout: (id, mediaLayout) => {
        set((state) => ({
          slides: state.slides.map((s) => (s.id === id ? { ...s, mediaLayout } : s)),
        }));
      },

      setMediaFocalPoint: (id, mediaId, x, y) => {
        set((state) => ({
          slides: state.slides.map((s) =>
            s.id === id
              ? {
                  ...s,
                  media: s.media.map((item) =>
                    item.id === mediaId ? { ...item, focalX: x, focalY: y } : item
                  ),
                }
              : s
          ),
        }));
      },

      importThread: (raw) => {
        const tweets = parseThread(raw);
        const profile = get().slides.find((s) => s.id === get().selectedSlideId)?.profile ?? get().profile;
        const slides = tweets.map((text) => emptySlide(truncateCharacters(text, TWEET_MAX_CHARS), profile));
        set({ slides, selectedSlideId: slides[0]?.id ?? null });
      },

      updateSlideProfile: (id, profile) => {
        set((state) => ({
          slides: state.slides.map((s) => (s.id === id ? { ...s, profile: { ...s.profile, ...profile } } : s)),
          profile: { ...state.profile, ...profile },
        }));
      },
      updateSlideDateTime: (id, postDateTime) => {
        set((state) => ({ slides: state.slides.map((s) => (s.id === id ? { ...s, postDateTime } : s)) }));
      },
      updateSlideMetrics: (id, metrics) => {
        set((state) => ({
          slides: state.slides.map((s) => (s.id === id ? { ...s, metrics: { ...s.metrics, ...metrics } } : s)),
        }));
      },
      updateSlideDisplay: (id, display) => {
        set((state) => ({
          slides: state.slides.map((s) => (s.id === id ? { ...s, display: { ...s.display, ...display } } : s)),
        }));
      },
      applyProfileToAll: (sourceId) => {
        const source = get().slides.find((s) => s.id === sourceId);
        if (!source) return;
        set((state) => ({
          profile: { ...source.profile },
          slides: state.slides.map((s) => ({ ...s, profile: { ...source.profile } })),
        }));
      },
      hydrateMedia: async () => {
        const slides = get().slides;
        const sources = new Map<string, string>();
        await Promise.all(slides.flatMap((slide) => slide.media.map(async (media) => {
          if (media.src) return;
          const blob = await loadMediaBlob(media.storageId);
          if (blob) sources.set(media.id, URL.createObjectURL(blob));
        })));
        set((state) => ({
          slides: state.slides.map((slide) => ({
            ...slide,
            media: slide.media.map((media) => sources.has(media.id) ? { ...media, src: sources.get(media.id) } : media),
          })),
        }));
      },
      setCardTheme: (cardTheme) => set({ cardTheme }),
      setCardStyle: (cardStyle) => set({ cardStyle }),
      setFrameBackground: (frameBackground) => set({ frameBackground }),
      setAspectRatio: (aspectRatio) => set({ aspectRatio }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      markProfileIntroShown: () => set({ profileIntroShown: true }),

      reset: () => set({ slides: [], selectedSlideId: null }),
    }),
    {
      name: "x-carrousel-store",
      version: 2,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        slides: state.slides.map((s) => ({
          ...s,
          media: s.media.map((media) => ({
            ...media,
            src: media.src?.startsWith("data:") ? media.src : undefined,
          })),
        })),
        selectedSlideId: state.selectedSlideId,
        profile: state.profile,
        cardTheme: state.cardTheme,
        cardStyle: state.cardStyle,
        frameBackground: state.frameBackground,
        aspectRatio: state.aspectRatio,
        soundEnabled: state.soundEnabled,
        profileIntroShown: state.profileIntroShown,
      }),
      migrate: (persistedState) => {
        const old = persistedState as Partial<AppState> & {
          postDateTime?: string;
          showXLogo?: boolean;
          slides?: Array<Partial<Slide> & { media?: unknown }>;
        };
        return {
          ...old,
          slides: (old.slides ?? []).map((slide) => {
            const legacyMedia = slide.media && !Array.isArray(slide.media) ? slide.media as {
              kind?: "image" | "video";
              dataUrl?: string;
              objectUrl?: string;
              name?: string;
              focalX?: number;
              focalY?: number;
            } : undefined;
            return {
              ...emptySlide(slide.text ?? "", slide.profile ?? old.profile ?? defaultProfile),
              ...slide,
              profile: slide.profile ?? old.profile ?? defaultProfile,
              postDateTime: slide.postDateTime ?? old.postDateTime ?? DEFAULT_POST_DATETIME,
              metrics: slide.metrics ?? defaultMetrics,
              display: slide.display ?? { ...defaultDisplay, showMetrics: false, showXLogo: old.showXLogo ?? true },
              media: Array.isArray(slide.media)
                ? slide.media
                : legacyMedia
                  ? [{
                      id: makeId(),
                      storageId: makeId(),
                      kind: legacyMedia.kind === "video" ? "video" : "image",
                      src: legacyMedia.dataUrl ?? legacyMedia.objectUrl,
                      name: legacyMedia.name ?? "media",
                      focalX: legacyMedia.focalX,
                      focalY: legacyMedia.focalY,
                    }]
                  : [],
              mediaLayout: slide.mediaLayout ?? "grid",
            } satisfies Slide;
          }),
        } as AppState;
      },
    }
  )
);
