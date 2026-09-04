<p align="center">
  <img src="public/logo.png" width="128" alt="thread to carousel">
</p>

<h1 align="center">hi, this is thread to carousel</h1>

<p align="center">
  a local-first studio for composing hyper-realistic X-style threads and exporting them as social carousels.<br>
  everything runs directly in your browser — zero tracking, zero lock-in.
</p>

<p align="center">
  <a href="https://github.com/joaodellarmelina/thread-to-carousel">
    <b>open repo on github</b>
  </a>
</p>

<p align="center">
  <img width="1270" height="581" alt="Screenshot 2026-09-04 at 2 01 32 AM" src="https://github.com/user-attachments/assets/e41b0bbb-a37c-427e-b508-d07e4c5f827b" />
</p>
<div align="center">
  <table>
    <tr>
      <td align="center">
        <img width="360" alt="01-get-to-know-sam-altman" src="https://github.com/user-attachments/assets/e65a5087-15aa-4b4f-860d-54a963996771" />
      </td>
      <td align="center">
        <img width="360" alt="02-who-is-jo-o-dellarmelina" src="https://github.com/user-attachments/assets/e6e867d9-6df7-4201-8ee9-d03cb2b62434" />
      </td>
    </tr>
  </table>
</div>
## why

your posts and media stay in your browser. no external API, no account, no sync server, no lock-in.
project metadata lives in `localStorage`, and binary media files are stored safely in `IndexedDB`.
close the tab, work offline, or reload — your edits pick up instantly with zero latency.

## what a slide looks like

every post in your thread is structured as a fully editable slide with customizable profile details, engagement metrics, date/time, and media assets.

```json
{
  "id": "slide_8f2a1b",
  "text": "shipping v2 of thread-to-carousel today 🚀",
  "profile": {
    "name": "João Dellarmelina",
    "handle": "joaodellarmelina",
    "verified": true
  },
  "postDateTime": "2026-09-10T18:00",
  "metrics": {
    "replies": "24",
    "reposts": "108",
    "likes": "1.2K",
    "bookmarks": "86",
    "views": "48K"
  },
  "mediaLayout": "grid",
  "display": {
    "showMetrics": true,
    "showViews": true,
    "showDate": true,
    "showXLogo": true
  }
}
```

paste a raw thread (paragraphs or `---` delimiters split it into slides automatically) or build your thread slide by slide.

## edit with rich text, see it rendered

<p align="center">
  <img width="1781" height="893" alt="Screenshot 2026-09-04 at 2 01 48 AM" src="https://github.com/user-attachments/assets/bb60cb87-cf02-43e6-bc75-ea1b44583b8d" />
</p>

captions support inline bold (`⌘B`) and italic (`⌘I`) formatting with live auto-fitting text scaling, date-time pickers, and real-time character limit counters.

attach up to 4 photos, GIFs, or videos per slide with per-image focal point adjustment, custom 1/2/3/4 media grids or vertical media layouts, and smooth drag-and-drop slide reordering.

<p align="center">
  <img width="1342" height="644" alt="Screenshot 2026-09-04 at 2 03 36 AM" src="https://github.com/user-attachments/assets/59072984-6dee-441b-9dcb-1a7182e06bf5" />
</p>

## shortcuts

| | |
|---|---|
| `⌘B` | bold formatted text selection |
| `⌘I` | italic formatted text selection |
| `Drag & Drop` | reorder slides in the rail |
| `Focal Drag` | adjust per-image focal point position |
| `Import` | paste raw thread text (split into slides) |
| `Export` | download individual slide PNGs or complete carousel ZIP |

## run it yourself

```sh
git clone https://github.com/joaodellarmelina/thread-to-carousel.git
cd thread-to-carousel
pnpm install
pnpm dev
```

that's it -- open `http://localhost:3000/app` and you're up and running.

## build & verify

```sh
pnpm lint
pnpm build
```

output lands in `.next/`.

## how it works

```
app/layout.tsx         root layout, Cuelume UI provider, fonts
app/page.tsx           landing page view
app/app/page.tsx       studio editor view
components/editor.tsx  main editor container with slide rail and canvas
components/tweet-card.tsx hyper-realistic X-style tweet card renderer
components/slide-canvas.tsx slide preview and editor workspace
components/slide-rail.tsx  drag-and-drop slide thumbnail rail (@dnd-kit)
lib/store.ts           Zustand store (localStorage persistence & migration)
lib/media-db.ts        IndexedDB storage for binary media blobs
lib/export.ts          html-to-image PNG canvas renderer & JSZip exporter
lib/parse-thread.ts    heuristic thread block splitter
```

a few things worth knowing if you're poking around:

- **local-first binary storage** — project metadata lives in `localStorage`, while heavy binary media files (images, GIFs, videos) are saved in `IndexedDB` via `media-db.ts` to prevent exceeding `localStorage` quotas.
- **atomic canvas rendering** — slide export uses `html-to-image` at high pixel density (`1080x1350`, `1080x1080`, or `1080x1920`) and packages full carousels into a single `.zip` file using `jszip`.
- **drag-and-drop reordering** — slide ordering uses `@dnd-kit/core` and `@dnd-kit/sortable` for smooth drag-and-drop organization.
- **sound effects** — interactive UI sound feedback is powered by `cuelume`, with a global toggle in the main toolbar.
- **strictly local & private** — no external APIs, no backend database, and zero network calls when editing or exporting carousels.

if you wanna make an addition + pr, or just wanna remix the app for yourself, go for it. open a pr and i'll review it! :)

## license

mit
