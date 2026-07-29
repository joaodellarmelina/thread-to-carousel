# 004 — Reuse the shared backdropFade token in slide-canvas crossfade

- **Status**: TODO
- **Commit**: a2b3d67
- **Severity**: LOW
- **Category**: Cohesion / Tokens
- **Estimated scope**: 1 file, 1 import + 1 value swap

## Problem

The slide-to-slide crossfade in the canvas hand-types
`transition={{ duration: 0.2 }}`, which is exactly the same value as the
shared `backdropFade` token already defined in `lib/motion.ts` and imported
by six other components. This is an unlabeled duplicate of an existing
token — a future change to the app's fade duration would silently miss this
one call site.

```tsx
/* components/slide-canvas.tsx:94-104 — current */
<AnimatePresence>
  <motion.div
    key={slide.id}
    // Opacity-only — a `scale` transform on an ancestor of overflow-hidden
    // text can cause a momentary sub-pixel clip on tall glyphs (e.g. capital
    // letters) mid-animation in some browsers. Fading avoids that entirely.
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="absolute inset-0"
  >
```

```ts
/* lib/motion.ts:1-7 — current, for reference */
import type { Transition } from "motion/react";

/** Shared spring for modal/panel surfaces entering and exiting. */
export const modalSpring: Transition = { type: "spring", bounce: 0, duration: 0.35 };

/** Shared fade for modal backdrops. */
export const backdropFade: Transition = { duration: 0.2 };
```

## Target

```tsx
/* target — components/slide-canvas.tsx imports */
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "@/lib/store";
import { ASPECT_DIMENSIONS } from "@/lib/types";
import type { SlideMedia } from "@/lib/types";
import { TWEET_MAX_CHARS } from "@/lib/constants";
import { backdropFade } from "@/lib/motion";
import { TweetCard } from "./tweet-card";
import { MediaDropzone } from "./media-dropzone";
import { TextFitDialog } from "./text-fit-dialog";
import { TextFitProbe, type TextFitResult } from "./text-fit-probe";
```

```tsx
/* target — components/slide-canvas.tsx:94-104 */
<AnimatePresence>
  <motion.div
    key={slide.id}
    // Opacity-only — a `scale` transform on an ancestor of overflow-hidden
    // text can cause a momentary sub-pixel clip on tall glyphs (e.g. capital
    // letters) mid-animation in some browsers. Fading avoids that entirely.
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={backdropFade}
    className="absolute inset-0"
  >
```

Note: `backdropFade`'s name describes its original use (modal backdrops) but
its value (`{ duration: 0.2 }`) is what's actually being reused here — this
plan does not rename the token, only points a second call site at it. (If a
future plan wants to rename it to something more general like `fadeShort`,
that is out of scope here — do not rename it as part of this plan.)

## Repo conventions to follow

- `lib/motion.ts` is the single source of truth for shared Motion
  transitions in this repo; every modal (`components/frame-picker.tsx:45`,
  `components/date-time-picker.tsx:23`, `components/profile-panel.tsx:15`,
  `components/export-panel.tsx:149`, `components/thread-importer.tsx:28`,
  `components/text-fit-dialog.tsx:22`) already imports `backdropFade` this
  same way: `import { modalSpring, backdropFade } from "@/lib/motion";`.
  Follow that exact import pattern (only `backdropFade` is needed here,
  `modalSpring` is not used in `slide-canvas.tsx`).

## Steps

1. In `components/slide-canvas.tsx`, add `import { backdropFade } from "@/lib/motion";`
   to the import block (after the existing `@/lib/constants` import, before
   the local component imports — matching the existing import ordering
   convention of external/`@/lib` imports before local `./` imports).
2. Replace `transition={{ duration: 0.2 }}` (in the `motion.div` inside the
   `AnimatePresence` around line 103) with `transition={backdropFade}`.
3. Leave the `initial`/`animate`/`exit` props, the comment above them, and
   everything else in the file untouched.

## Boundaries

- Do NOT touch any other file, including `lib/motion.ts` itself.
- Do NOT rename `backdropFade` or change its value.
- Do NOT change any other `transition` in this file (there is only one).
- Do NOT add new dependencies.
- If the target `motion.div`'s props no longer match the quoted current
  code, STOP and report instead of guessing.

## Verification

- **Mechanical**: `npx tsc --noEmit`, `npm run lint`, `npm run build` — all clean.
  This is a pure value-identity swap (`{ duration: 0.2 }` → `backdropFade`,
  which equals `{ duration: 0.2 }`), so no runtime behavior change is
  expected at all.
- **Feel check**: in the app, select different slides in the slide rail and
  confirm the canvas crossfade duration and feel are pixel-identical to
  before the change (0.2s opacity fade, no visible timing shift). This is a
  no-op-by-design change — the only thing to verify is that nothing broke.
- **Done when**: `slide-canvas.tsx` imports and uses `backdropFade` instead
  of a duplicated inline literal, and the crossfade behaves identically to
  before.
