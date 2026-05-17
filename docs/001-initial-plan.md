# Fog of Walk — Implementation Plan

## Context

Build a single-page app where users import GPX/FIT activity files and explore a map where the fog of war is cleared along their tracked routes. Files are processed in a Web Worker for performance (target: 500–1000+ files). Fog is rendered as a MapLibre GL fill polygon with holes punched out along buffered track paths. Base map is OpenFreeMap via PMTiles (free, no API key).

All confirmed requirements:
- In-memory only (no persistence)
- Scale: thousands of files → Web Worker + incremental fog updates
- Base map: OpenFreeMap (`tiles.openfreemap.org/styles/liberty`)
- Fog: MapLibre fill layer, world polygon with holes
- Track lines: toggleable on/off with a switch
- Fog radius: hardcoded constant (50 m)
- File removal: clear-all only
- React Router SPA: clientLoader + clientAction + useFetcher

---

## File Structure

```
app/
  constants/
    fog.ts                   ← FOG_CLEAR_RADIUS_METERS, FOG_EMIT_INTERVAL_MS, MAP_STYLE_URL
  types/
    tracks.ts                ← TrackCoords, ParsedTrack, WorkerInboundMessage, WorkerOutboundMessage
  lib/
    utils.ts                 ← existing (untouched)
    mapStore.ts              ← module-level singleton: map instance, worker ref, fog holes, track list
    parsers/
      index.ts               ← parseFile(file: File): Promise<ParsedTrack[]>  — routes by extension
      gpx.ts                 ← DOMParser + @tmcw/togeojson → ParsedTrack[] (main thread only)
      fit.ts                 ← fit-file-parser → ParsedTrack[] (main thread, callback-based)
  workers/
    fogWorker.ts             ← geometry only: simplify + buffer + union + time-based emit
  components/
    ui/                      ← existing button.tsx + new switch, badge (via shadcn)
    MapView.tsx              ← MapLibre mount/teardown, sources/layers, worker message handler
    ControlPanel.tsx         ← floating panel: add files, clear all, track toggle, track count
  routes/
    home.tsx                 ← full replacement: clientLoader + clientAction + layout
vite.config.ts               ← add worker: { format: "es" }
docs/
  architecture.md            ← overview, data flow diagram
  data-formats.md            ← ParsedTrack type, GPX/FIT parsing, adding new formats
  fog-algorithm.md           ← buffer → union → hole extraction → MapLibre update
```

---

## Step-by-Step Implementation

### Step 1 — Install dependencies

```bash
bun add maplibre-gl pmtiles @tmcw/togeojson fit-file-parser
bun add @turf/buffer @turf/union @turf/helpers @turf/simplify @turf/bbox
bun add -D @types/geojson
```

Individual `@turf/*` packages instead of the full `@turf/turf` bundle to keep the worker chunk lean.

### Step 2 — Add shadcn components

```bash
bunx --bun shadcn@latest add switch
bunx --bun shadcn@latest add badge
```

### Step 3 — Update `vite.config.ts`

Add `worker: { format: "es" }` to `defineConfig`. Required for top-level `import` inside `fogWorker.ts`.

```ts
export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  worker: { format: "es" },
})
```

### Step 4 — `app/constants/fog.ts`

```ts
export const FOG_CLEAR_RADIUS_METERS = 50
export const FOG_EMIT_INTERVAL_MS = 3000     // emit fog update at most every 3 s
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty"
export const FOG_COLOR = "#0a0a1e"
export const FOG_OPACITY = 0.8
export const TRACK_COLOR = "#ff6b35"
export const SIMPLIFY_TOLERANCE = 0.00005   // ~5 m at equator
```

### Step 5 — `app/types/tracks.ts`

```ts
export type TrackCoords = [number, number][]   // [lng, lat] pairs

export interface ParsedTrack {
  id: string           // crypto.randomUUID()
  name: string
  coordinates: TrackCoords
  format: "gpx" | "fit"   // extensible: add "kml" | "tcx" etc. later
}

// Main → Worker: single message type for all formats
export type WorkerInboundMessage =
  | { type: "PROCESS_TRACKS"; tracks: ParsedTrack[] }
  | { type: "RESET" }

// Worker → Main
export type WorkerOutboundMessage =
  | { type: "FOG_UPDATE"; holes: GeoJSON.Position[][][]; processedCount: number }
  | { type: "ERROR"; file: string; message: string }
  | { type: "DONE"; processedCount: number }
```

### Step 6 — `app/lib/mapStore.ts`

Module-level singleton. Bypasses React state for binary data and MapLibre instance refs.

```ts
export const mapStore = {
  map: null as maplibregl.Map | null,
  worker: null as Worker | null,
  fogHoles: [] as GeoJSON.Position[][][],
  tracks: [] as ParsedTrack[],
  processingCount: 0,
  totalSent: 0,
}
```

### Step 7 — Parsers (`app/lib/parsers/`)

All parsers share the same signature: `parse(file: File): Promise<ParsedTrack[]>`. The `index.ts` dispatcher routes by extension. Adding a new format means adding one file and one entry in the dispatcher — the worker, clientAction, and UI are untouched.

**`app/lib/parsers/index.ts`**:
```ts
export async function parseFile(file: File): Promise<ParsedTrack[]> {
  const ext = file.name.split(".").pop()?.toLowerCase()
  if (ext === "gpx") return parseGpxFile(file)
  if (ext === "fit") return parseFitFile(file)
  throw new Error(`Unsupported format: .${ext}`)
}
```

**`app/lib/parsers/gpx.ts`** — DOMParser is main-thread-only; cannot be called inside a Worker:
```ts
import { gpx } from "@tmcw/togeojson"

export async function parseGpxFile(file: File): Promise<ParsedTrack[]> {
  const text = await file.text()
  const dom = new DOMParser().parseFromString(text, "text/xml")
  const geo = gpx(dom)
  // flatten LineString and MultiLineString features into ParsedTrack[]
}
```

**`app/lib/parsers/fit.ts`** — `fit-file-parser` is pure JS, works in main thread:
```ts
import FitParser from "fit-file-parser"

export async function parseFitFile(file: File): Promise<ParsedTrack[]> {
  const buffer = await file.arrayBuffer()
  return new Promise((resolve, reject) => {
    const parser = new FitParser({ force: true, speedUnit: "m/s" })
    parser.parse(buffer, (error, data) => {
      if (error) return reject(error)
      const coords = data.records
        .filter(r => r.position_lat != null && r.position_long != null)
        .map(r => [
          r.position_long * (180 / 2 ** 31),   // semicircles → degrees
          r.position_lat  * (180 / 2 ** 31),
        ] as [number, number])
      resolve([{ id: crypto.randomUUID(), name: file.name, coordinates: coords, format: "fit" }])
    })
  })
}
```

### Step 8 — `app/workers/fogWorker.ts`

The worker does geometry only. All format-specific parsing is done in the main thread before this point.

```
/// <reference lib="webworker" />

Internal state:
  accumulatedUnion: Feature<Polygon|MultiPolygon> | null = null
  processedCount = 0
  lastEmitTime = 0

On PROCESS_TRACKS (array of ParsedTrack):
  For each track:
    1. lineString(coordinates) → Feature<LineString>
    2. simplify(line, { tolerance: SIMPLIFY_TOLERANCE, highQuality: false })
    3. buffer(simplified, FOG_CLEAR_RADIUS_METERS, { units: "meters" })
    4. if buffer result is non-null:
         accumulatedUnion = accumulatedUnion ? union(accumulatedUnion, bufferResult) : bufferResult
    5. processedCount++
    6. Check: if performance.now() - lastEmitTime >= FOG_EMIT_INTERVAL_MS:
         post FOG_UPDATE { holes: extractHoles(accumulatedUnion), processedCount }
         lastEmitTime = performance.now()

  After loop, always post DONE { processedCount }

On RESET:
  accumulatedUnion = null; processedCount = 0; lastEmitTime = 0
  post FOG_UPDATE { holes: [], processedCount: 0 }

Hole extraction helper:
  null → []
  Polygon → geometry.coordinates.slice(1)             (inner rings only)
  MultiPolygon → flatten all polygons' inner rings
```

The time-based check (`performance.now() - lastEmitTime >= FOG_EMIT_INTERVAL_MS`) guarantees consistent ~300 ms update cadence regardless of whether files are short segments or full marathon routes. A slow, complex track and 100 tiny tracks both result in the same smooth progressive reveal.

### Step 9 — `app/components/MapView.tsx`

- Import `maplibre-gl/dist/maplibre-gl.css` (required for controls)
- Register PMTiles protocol before map instantiation:
  ```ts
  import { Protocol } from "pmtiles"
  import maplibregl from "maplibre-gl"
  const protocol = new Protocol()
  maplibregl.addProtocol("pmtiles", protocol.tile)
  ```
- On `map.on("load")`: add `fog-source` (GeoJSON) + `fog-layer` (fill), `tracks-source` + `tracks-layer` (line)
- `buildFogGeoJSON(holes)` → `Feature<Polygon>` with world outer ring + holes as inner rings
- Worker `onmessage` handler in `useEffect`: on `FOG_UPDATE` → setData on `fog-source`; on `TRACK_PARSED` → append to tracks source; on `ERROR` → console.warn

**Track toggle** (switch): `map.setLayoutProperty("tracks-layer", "visibility", "visible" | "none")`

**Initial map view**: use `@turf/bbox` on all loaded tracks' coordinates to fit-bounds after processing completes.

### Step 10 — `app/components/ControlPanel.tsx`

Floating panel `absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur rounded-xl p-4 flex flex-col gap-3`:

- Hidden `<input type="file" ref accept=".gpx,.fit" multiple>`
- "Add files" Button (Phosphor `Plus` icon) → triggers hidden input click
- `onChange` on hidden input → `useFetcher.submit(formData, { method: "post", encType: "multipart/form-data" })`
- "Clear all" Button (Phosphor `Trash`, destructive variant) → `useFetcher.submit({ intent: "clear-all" }, { method: "post" })`
- `Switch` for track lines visibility
- `Badge` showing `{tracks.length} tracks` — derive from `mapStore.tracks.length` via React state

Track count state: expose a `useTrackCount` hook that the panel subscribes to.

### Step 11 — `app/routes/home.tsx` (full replacement)

```ts
export async function clientLoader() {
  // Init worker once (survives re-renders via mapStore)
  if (!mapStore.worker) {
    mapStore.worker = new Worker(
      new URL("~/workers/fogWorker.ts", import.meta.url),
      { type: "module" }
    )
  }
  return { initialized: true }
}
clientLoader.hydrate = true   // run on first client load in SPA mode

export async function clientAction({ request }) {
  const formData = await request.formData()
  const intent = formData.get("intent") as string

  if (intent === "add-files") {
    const files = formData.getAll("files") as File[]

    // Parse all formats in main thread via unified dispatcher
    const allTracks: ParsedTrack[] = []
    for (const file of files) {
      try {
        allTracks.push(...await parseFile(file))
      } catch (e) {
        console.warn(`Failed to parse ${file.name}:`, e)
      }
    }

    if (allTracks.length > 0) {
      mapStore.tracks.push(...allTracks)
      mapStore.worker?.postMessage({ type: "PROCESS_TRACKS", tracks: allTracks })
    }

    return { intent: "add-files", count: files.length }
  }

  if (intent === "clear-all") {
    mapStore.fogHoles = []
    mapStore.tracks = []
    mapStore.processingCount = 0
    mapStore.totalSent = 0
    mapStore.worker?.postMessage({ type: "RESET" })
    const map = mapStore.map
    if (map?.loaded()) {
      ;(map.getSource("fog-source") as GeoJSONSource)?.setData(buildFogGeoJSON([]))
      ;(map.getSource("tracks-source") as GeoJSONSource)?.setData({ type: "FeatureCollection", features: [] })
    }
    return { intent: "clear-all" }
  }
}

export default function Home() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <MapView />
      <ControlPanel />
    </div>
  )
}
```

The initial file dialog on page load: in `MapView.tsx`, after the map finishes loading, call `fileInputRef.current?.click()` via a one-time `map.once("idle", ...)` callback. This respects the user-gesture requirement (the click is deferred but still triggered by the load event, which browsers allow).

Actually — file input `.click()` without a user gesture is blocked on most browsers. **Better approach**: show a Dialog (shadcn) on mount with a "Select Files" button. The dialog is the first thing the user sees, and clicking "Select Files" is the gesture.

### Step 12 — `docs/` files

Three documentation files during implementation:
- `docs/architecture.md` — data flow, component tree, module boundaries
- `docs/data-formats.md` — `ParsedTrack` type, GPX/FIT specifics, coordinate conventions
- `docs/fog-algorithm.md` — buffer → union → hole extraction → MapLibre setData pipeline

---

## Key Pitfalls and Solutions

| Pitfall | Solution |
|---|---|
| `@turf/union` returns `null` for empty input | Initialize accumulator as `null`, guard before calling union |
| `MultiPolygon` union results | Flatten each polygon's inner rings into the holes array |
| DOMParser unavailable in Worker | All parsing done in main thread via `parseFile()` dispatcher; worker receives only `ParsedTrack[]` |
| Adding a new format (e.g. KML) | Add `app/lib/parsers/kml.ts` + one line in `parsers/index.ts`; no other files change |
| File input `.click()` without gesture blocked | Show Dialog on mount; user clicks "Select Files" button |
| Worker garbage-collected | Store worker in `mapStore` (module level), not in React state |
| Hot-reload duplicate workers | Guard `mapStore.worker` with null check in clientLoader |
| Fog update cadence | Worker uses `performance.now()` timer, not track count; consistent 300 ms intervals |
| MapLibre tiles not loading | Register `pmtiles` protocol BEFORE `new maplibregl.Map()` |

---

## Verification

1. Run `bun run dev`, open `localhost:5173`
2. Dialog appears on load → select a handful of GPX files → fog starts clearing progressively
3. Select a FIT file → also clears
4. Toggle the track lines switch → lines appear/disappear
5. Click "Add files" → more files can be layered on
6. Click "Clear all" → fog resets, track list clears
7. Run `bun run typecheck` → no type errors
8. Load 100+ files → no UI freeze (worker thread handles geometry)
