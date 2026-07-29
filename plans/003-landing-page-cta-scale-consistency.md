# 003 — Match landing-page CTA press scale to app convention

- **Status**: TODO
- **Commit**: a2b3d67
- **Severity**: LOW
- **Category**: Cohesion / Tokens
- **Estimated scope**: 1 file, 3 one-value edits

## Problem

The landing page's three CTA links use `active:scale-95`, but every
equivalent full pill/text CTA button elsewhere in the app uses
`active:scale-[0.97]`. `0.95` is a visibly harder press than the rest of the
product, on the one page most first-time visitors see before anything else.

```tsx
/* components/landing-page.tsx:64-69 — current */
<Link
  href="/app"
  className="material rounded-full px-4 py-1.5 text-xs font-medium lowercase transition-transform active:scale-95"
>
  open the editor
</Link>
```

```tsx
/* components/landing-page.tsx:83-89 — current */
<Link
  href="/app"
  className="rounded-full px-6 py-3 text-sm font-medium lowercase text-white transition-transform active:scale-95"
  style={{ background: "var(--app-accent)" }}
>
  start creating — it&apos;s free
</Link>
```

```tsx
/* components/landing-page.tsx:129-135 — current */
<Link
  href="/app"
  className="rounded-full px-6 py-3 text-sm font-medium lowercase text-white transition-transform active:scale-95"
  style={{ background: "var(--app-accent)" }}
>
  try it now
</Link>
```

## Target

All three `active:scale-95` become `active:scale-[0.97]`, matching every
other pill/text CTA in the app (e.g. `components/empty-state.tsx:35`,
`components/thread-importer.tsx:78`, `components/export-panel.tsx:182`).
No other part of any of the three class strings changes.

## Repo conventions to follow

- Full-width/pill text CTAs use `active:scale-[0.97]` throughout the app —
  see `components/empty-state.tsx:35` (`transition-transform active:scale-[0.97]`)
  as the closest exemplar: same button shape and role (primary accent-colored
  CTA) as the landing page's hero and bottom CTAs.
- Only small circular icon-only buttons use the harder `active:scale-90`
  elsewhere (e.g. `components/toolbar.tsx:130`) — none of the three landing
  page links are that shape, so `0.97` is the correct target for all three,
  not `0.90`.

## Steps

1. In `components/landing-page.tsx`, on the header "open the editor" link
   (currently line 66), replace `active:scale-95` with `active:scale-[0.97]`.
2. On the hero "start creating — it's free" link (currently line 85), make
   the identical replacement.
3. On the bottom "try it now" link (currently line 131), make the identical
   replacement.
4. Leave every other class and the `style={{ background: "var(--app-accent)" }}`
   inline styles untouched.

## Boundaries

- Do NOT touch any other file.
- Do NOT change link hrefs, copy text, or layout classes — only the
  `active:scale-*` value on these three elements.
- Do NOT add new dependencies.
- If any of the three quoted `<Link>` elements no longer match the current
  code, STOP and report instead of guessing which class to change.

## Verification

- **Mechanical**: `npx tsc --noEmit`, `npm run lint`, `npm run build` — all clean.
- **Feel check**: load `/`, press-and-hold (or click) each of the three CTAs
  and compare the press depth side-by-side with the "paste a thread" button
  on the `/app` empty state (`components/empty-state.tsx`) — the two should
  feel like the same press weight. In DevTools Elements panel, confirm the
  computed `:active` transform is `scale(0.97)` on all three landing-page
  links, not `scale(0.95)`.
- **Done when**: all three landing-page CTAs read `active:scale-[0.97]` and
  feel identical in press depth to the rest of the app's pill CTAs.
