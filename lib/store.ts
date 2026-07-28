import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { makeId } from "./id";
import { parseThread } from "./parse-thread";
import { TWEET_MAX_CHARS } from "./constants";
import { DEFAULT_POST_DATETIME } from "./types";
import type { AspectRatio, CardStyle, CardTheme, Profile, Slide, SlideMedia } from "./types";

// Slide/profile images are compressed before they ever reach the store, but a
// long carousel with many images can still add up — localStorage's quota
// (~5-10MB) is a hard ceiling. A failed write should never crash the app;
// it just means that particular change won't survive a reload.
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
  postDateTime: string;
  showXLogo: boolean;

  addSlide: (text?: string) => string;
  removeSlide: (id: string) => void;
  duplicateSlide: (id: string) => void;
  updateSlideText: (id: string, text: string) => void;
  reorderSlides: (fromId: string, toId: string) => void;
  selectSlide: (id: string | null) => void;
  attachMedia: (id: string, media: SlideMedia) => void;
  clearMedia: (id: string) => void;
  setMediaFocalPoint: (id: string, x: number, y: number) => void;
  importThread: (raw: string) => void;
  setProfile: (profile: Partial<Profile>) => void;
  setCardTheme: (theme: CardTheme) => void;
  setCardStyle: (style: CardStyle) => void;
  setFrameBackground: (background: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setPostDateTime: (value: string) => void;
  setShowXLogo: (show: boolean) => void;
  markProfileIntroShown: () => void;
  reset: () => void;
}

const defaultProfile: Profile = {
  name: "Your Name",
  handle: "yourhandle",
  verified: true,
};

function emptySlide(text = ""): Slide {
  return { id: makeId(), text };
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      slides: [],
      selectedSlideId: null,
      profile: defaultProfile,
      cardTheme: "dark",
      cardStyle: "square",
      frameBackground: "linear-gradient(135deg, #7c3aed, #db2777)",
      aspectRatio: "4:5",
      soundEnabled: true,
      profileIntroShown: false,
      postDateTime: DEFAULT_POST_DATETIME,
      showXLogo: true,

      addSlide: (text = "") => {
        const slide = emptySlide(text);
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
          slides: state.slides.map((s) => (s.id === id ? { ...s, text } : s)),
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

      attachMedia: (id, media) => {
        set((state) => ({
          slides: state.slides.map((s) => (s.id === id ? { ...s, media } : s)),
        }));
      },

      clearMedia: (id) => {
        set((state) => ({
          slides: state.slides.map((s) => (s.id === id ? { ...s, media: undefined } : s)),
        }));
      },

      setMediaFocalPoint: (id, x, y) => {
        set((state) => ({
          slides: state.slides.map((s) =>
            s.id === id && s.media ? { ...s, media: { ...s.media, focalX: x, focalY: y } } : s
          ),
        }));
      },

      importThread: (raw) => {
        const tweets = parseThread(raw);
        const slides = tweets.map((text) => emptySlide(text.slice(0, TWEET_MAX_CHARS)));
        set({ slides, selectedSlideId: slides[0]?.id ?? null });
      },

      setProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } })),
      setCardTheme: (cardTheme) => set({ cardTheme }),
      setCardStyle: (cardStyle) => set({ cardStyle }),
      setFrameBackground: (frameBackground) => set({ frameBackground }),
      setAspectRatio: (aspectRatio) => set({ aspectRatio }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setPostDateTime: (postDateTime) => set({ postDateTime }),
      setShowXLogo: (showXLogo) => set({ showXLogo }),
      markProfileIntroShown: () => set({ profileIntroShown: true }),

      reset: () => set({ slides: [], selectedSlideId: null }),
    }),
    {
      name: "x-carrousel-store",
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        slides: state.slides.map((s) => ({
          ...s,
          media: s.media?.kind === "video" ? { ...s.media, objectUrl: undefined, needsReattach: true } : s.media,
        })),
        selectedSlideId: state.selectedSlideId,
        profile: state.profile,
        cardTheme: state.cardTheme,
        cardStyle: state.cardStyle,
        frameBackground: state.frameBackground,
        aspectRatio: state.aspectRatio,
        soundEnabled: state.soundEnabled,
        profileIntroShown: state.profileIntroShown,
        postDateTime: state.postDateTime,
        showXLogo: state.showXLogo,
      }),
    }
  )
);
