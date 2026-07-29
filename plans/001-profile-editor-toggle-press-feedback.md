# 001 — Add press feedback to profile-editor toggle buttons

- **Status**: TODO
- **Commit**: a2b3d67
- **Severity**: MEDIUM
- **Category**: Cohesion / Physicality
- **Estimated scope**: 1 file, 2 one-word class additions

## Problem

The "verified badge" and "x logo" toggle buttons in the profile editor have no
press feedback — every other clickable control in the app (toolbar buttons,
dialog buttons, thumbnail actions, empty-state CTAs) scales down on `:active`.
These two feel dead by comparison, mid-flow, right next to buttons that do
scale.

```tsx
/* components/profile-editor.tsx:66-87 — current */
<div className="flex gap-1.5">
  <button
    data-cuelume-toggle
    onClick={() => setProfile({ verified: !profile.verified })}
    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${
      profile.verified ? "bg-[#1d9bf0]/15 text-[#1d9bf0]" : "bg-white/5 text-[var(--app-fg-muted)]"
    }`}
  >
    <BadgeCheck size={13} />
    <span className="lowercase">verified badge</span>
  </button>
  <button
    data-cuelume-toggle
    onClick={() => setShowXLogo(!showXLogo)}
    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors ${
      showXLogo ? "bg-[#1d9bf0]/15 text-[#1d9bf0]" : "bg-white/5 text-[var(--app-fg-muted)]"
    }`}
  >
    <XLogo style={{ width: 13, height: 13 }} />
    <span className="lowercase">x logo</span>
  </button>
</div>
```

## Target

Both buttons gain the same `active:scale-[0.97]` press feedback used by every
other pill/text button in the app, combined into the existing `transition-colors`
so both color and transform are covered by one Tailwind transition utility:

```tsx
/* target */
<div className="flex gap-1.5">
  <button
    data-cuelume-toggle
    onClick={() => setProfile({ verified: !profile.verified })}
    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-[color,background-color,transform] active:scale-[0.97] ${
      profile.verified ? "bg-[#1d9bf0]/15 text-[#1d9bf0]" : "bg-white/5 text-[var(--app-fg-muted)]"
    }`}
  >
    <BadgeCheck size={13} />
    <span className="lowercase">verified badge</span>
  </button>
  <button
    data-cuelume-toggle
    onClick={() => setShowXLogo(!showXLogo)}
    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-[color,background-color,transform] active:scale-[0.97] ${
      showXLogo ? "bg-[#1d9bf0]/15 text-[#1d9bf0]" : "bg-white/5 text-[var(--app-fg-muted)]"
    }`}
  >
    <XLogo style={{ width: 13, height: 13 }} />
    <span className="lowercase">x logo</span>
  </button>
</div>
```

`transition-[color,background-color,transform]` (an explicit property list,
not `transition-colors`) is required so the `active:scale` transform is
actually covered by a transition — `transition-colors` alone only transitions
color-family properties and would make the scale snap instantly.

## Repo conventions to follow

- Toggle buttons elsewhere in the app already combine a multi-property
  transition with `active:scale-[0.97]` this exact way — see
  `components/toolbar.tsx:96` (`transition-[color,background-color,transform] ... active:scale-[0.97]`)
  on the aspect-ratio toggle button. Copy that pattern verbatim, don't invent
  a new one.
- Pill/text buttons in this app use `active:scale-[0.97]`; only small
  circular icon-only buttons (avatar, close `X` buttons, drag handles) use
  the harder `active:scale-90`. These two buttons are pill/text buttons, so
  `0.97` is correct, not `0.90`.

## Steps

1. In `components/profile-editor.tsx`, on the "verified badge" button
   (currently line 70), replace `transition-colors` with
   `transition-[color,background-color,transform] active:scale-[0.97]`.
2. On the "x logo" button (currently line 80), make the identical
   replacement.
3. Leave every other class, the conditional color logic, and the JSX
   structure untouched.

## Boundaries

- Do NOT touch any other file.
- Do NOT change the toggle behavior/logic, only the className strings.
- Do NOT add new dependencies.
- If the button markup has drifted from what's quoted above (e.g. different
  class names already present), STOP and report instead of guessing.

## Verification

- **Mechanical**: `npx tsc --noEmit`, `npm run lint`, `npm run build` — all clean, no new errors.
- **Feel check**: open the app, add a slide, open the profile panel (avatar
  button in the toolbar), and click/hold each of "verified badge" and "x
  logo":
  - Both buttons visibly compress (scale down slightly) on press and spring
    back on release, matching the feel of the "verified badge" button's
    neighbor buttons elsewhere in the toolbar.
  - The color transition (active ↔ inactive state) still animates smoothly —
    it must not have been broken by the transition-property change.
  - In DevTools Animations panel, confirm the press transition is not
    instant (i.e. `transition-colors`-only regression didn't slip back in).
- **Done when**: both buttons have visible, on-brand press feedback
  identical in scale amount and easing to `components/toolbar.tsx`'s toggle
  buttons, and the build is clean.
