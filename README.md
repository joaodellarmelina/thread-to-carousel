# Thread to Carrousel

A local-first studio for composing hyper-realistic X-style threads and exporting them as social carousels. It does not connect to X or use an external content API.

## Features

- Fully editable posts, profiles, timestamps, and engagement metrics
- Inline rich text with bold and italic formatting
- Up to four photos, GIFs, or videos per post
- X-style 1/2/3/4 media grids and vertical media layout
- Per-image focal point adjustment and media reordering
- Light/dark cards, framed or edge-to-edge layouts, and custom backgrounds
- 1:1, 4:5, and 9:16 exports
- Individual PNG or full ZIP export
- Project metadata in localStorage and binary media in IndexedDB

## Development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000/app`.

## Verification

```bash
pnpm lint
pnpm build
```
