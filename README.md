# Fog of Walk

Import your GPS activity files and watch the fog of war lift over every trail you've run, every road you've cycled, every path you've ever walked.

**Browser-only.** No account, no server, no data leaves your device.

---

## Features

- Import `.gpx` and `.fit` activity files (drag-and-drop or file picker)
- Two fog modes:
  - **Corridor** — clears a 100 m band along each route
  - **Fill** — also clears the interior of closed loops
- Real-time fog rendering as files are processed
- Track stats
- Works offline after first load

## Getting started

```bash
bun install
bun run dev
```

Open `http://localhost:5173`, import some activity files, watch the fog clear.

## Commands

```bash
bun run dev        # dev server
bun run build      # production build
bun run typecheck  # type-check (react-router typegen + tsc)
bun run format     # prettier
```

## Deploy

A Dockerfile is included for self-hosting:

```bash
docker build -t fogofwalk .
docker run -p 3000:3000 fogofwalk
```

The build output is a fully static SPA served by `@react-router/serve`. You can also drop the `build/client/` directory on any static host (Vercel, Cloudflare Pages, S3, etc.) — no server required.

## Architecture

```
routes/home.tsx      clientLoader (worker setup) + clientAction (file parsing)
  MapView.tsx        MapLibre GL map, fog source, track source, worker messages
  ControlPanel.tsx   file import, clear, mode toggle, track visibility
  TrackStatsPanel    per-file distance/point counts

lib/mapStore.ts      module singleton — map instance, worker ref, fog data, track list
workers/fogWorker.ts all geometry: simplify → buffer → union/difference → fog polygon
lib/parsers/         gpx.ts (@tmcw/togeojson) + fit.ts (fit-file-parser)
```

Parsing runs on the main thread (browser APIs required), geometry runs in a Web Worker. The fog polygon is a GeoJSON `Polygon` covering the world with holes cut out for explored areas, updated every 300 ms.

## Stack

- [React Router 7](https://reactrouter.com/) (SPA mode)
- [MapLibre GL JS](https://maplibre.org/) + [OpenFreeMap](https://openfreemap.org/) tiles via [PMTiles](https://protomaps.com/docs/pmtiles)
- [Turf.js](https://turfjs.org/) for geometry
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Vite](https://vitejs.dev/) + [Bun](https://bun.sh/)
