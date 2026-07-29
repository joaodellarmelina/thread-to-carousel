# 002 — Gate slide-thumbnail hover controls to hover-capable pointers

- **Status**: TODO
- **Commit**: a2b3d67
- **Severity**: MEDIUM
- **Category**: Accessibility (touch)
- **Estimated scope**: 1 file, 3 className edits

## Problem

The duplicate/delete buttons and the drag handle on each slide thumbnail are
only revealed via a plain `group-hover:opacity-100` — gated on nothing but
`:hover`. Touch devices either can't trigger `:hover` at all (leaving these
controls completely unreachable without a mouse) or simulate a "sticky"
hover on tap that doesn't clear until the user taps elsewhere, which reads as
a stuck/broken control.

```tsx
/* components/slide-thumbnail.tsx:76 — current */
<div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
  <button ... /* duplicate */>
  <button ... /* delete */>
</div>
```

```tsx
/* components/slide-thumbnail.tsx:95-99 — current */
<div
  {...attributes}
  {...listeners}
  className="absolute bottom-1.5 right-1.5 cursor-grab rounded-md bg-black/60 p-1 text-white/60 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
  title="drag to reorder"
>
```

## Target

Keep the hover-reveal behavior exactly as-is for mice/trackpads (devices
that report `hover: hover` and `pointer: fine`), but make the controls
visible by default everywhere else, so touch users always see them:

```tsx
/* target — components/slide-thumbnail.tsx:76 */
<div className="absolute right-1.5 top-1.5 flex gap-1 opacity-100 transition-opacity [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100">
  <button ... /* duplicate */>
  <button ... /* delete */>
</div>
```

```tsx
/* target — components/slide-thumbnail.tsx:95-99 */
<div
  {...attributes}
  {...listeners}
  className="absolute bottom-1.5 right-1.5 cursor-grab rounded-md bg-black/60 p-1 text-white/60 opacity-100 transition-opacity [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 active:cursor-grabbing"
  title="drag to reorder"
>
```

Net effect: on `(hover: hover) and (pointer: fine)` devices (mouse/trackpad),
behavior is unchanged — hidden until hover. On every other device (touch,
hybrid), the controls are simply always visible at `opacity-100`, no reveal
gesture required.

## Repo conventions to follow

- This is a Tailwind v4 project (`@import "tailwindcss"` in
  `app/globals.css:1`) — Tailwind v4 supports arbitrary media-query variants
  written as `[@media(...)]:` directly in class names, no config changes
  needed. Use that syntax exactly as shown above (parentheses and colons
  inside the bracket must not contain unescaped spaces — use `_` in place of
  spaces inside the bracket per Tailwind's arbitrary-variant syntax, as
  written above).
- No other component in this repo currently gates hover this way — there is
  no existing exemplar to imitate. Follow the target code above exactly.

## Steps

1. In `components/slide-thumbnail.tsx`, on the duplicate/delete button
   wrapper `<div>` (currently line 76), replace
   `opacity-0 transition-opacity group-hover:opacity-100` with
   `opacity-100 transition-opacity [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100`.
2. On the drag-handle `<div>` (currently lines 95-99), make the identical
   replacement to its `opacity-0 transition-opacity group-hover:opacity-100`
   segment, keeping `active:cursor-grabbing` and every other class as-is.
3. Do not touch the button/icon contents, the `attributes`/`listeners`
   spread, or any other part of the component.

## Boundaries

- Do NOT touch any other file.
- Do NOT change the `data-cuelume-*` attributes, click handlers, or icon
  sizes.
- Do NOT add new dependencies or a Tailwind config file to define a named
  variant — the arbitrary-variant syntax inline is sufficient and matches
  Tailwind v4's zero-config approach already in use in this repo.
- If the two target `<div>`s no longer match the quoted current code (class
  list has changed), STOP and report instead of guessing where to insert the
  new variant.

## Verification

- **Mechanical**: `npx tsc --noEmit`, `npm run lint`, `npm run build` — all clean.
- **Feel check**:
  - With a mouse/trackpad (real device, not devtools emulation — devtools'
    touch emulation does not reliably flip `pointer`/`hover` media
    features): hover over a slide thumbnail — duplicate/delete/drag-handle
    fade in exactly as before; move the mouse away — they fade back out.
  - In Chrome DevTools, open the Rendering tab or use the device toolbar's
    touch simulation, or check via the Elements panel's "Force element
    state" is not sufficient here — instead verify with the **Emulate CSS
    media feature `pointer`** dropdown (Rendering tab → "Emulate CSS media
    feature `forced-colors`" section also lists `pointer`/`hover` — use
    it): set `hover: none` / `pointer: coarse` and confirm all three
    controls are visible at full opacity with no hover needed.
  - Confirm no layout shift when the controls are always-visible on a
    touch-emulated viewport — they're absolutely positioned, so this should
    be a non-issue, but check visually.
- **Done when**: on mouse/trackpad the reveal-on-hover behavior is pixel-for-pixel
  unchanged from before, and on any device reporting `hover: none` or
  `pointer: coarse`, all three controls are visible without requiring a
  hover gesture.
