# Fog of Walk — Claude Context

## What this is

Browser-only SPA. Users import GPX/FIT activity files; fog of war clears along their routes. No server, no persistence — everything runs in the browser.

## Commands

```bash
bun run dev        # dev server
bun run typecheck  # react-router typegen + tsc (run after every change)
bun run build      # production build
bun run format     # prettier
```

## Architecture

```
routes/home.tsx          clientLoader (creates worker) + clientAction (parses files, posts to worker)
  └─ MapView.tsx         mounts MapLibre, owns fog-source + tracks-source, handles worker messages
  └─ ControlPanel.tsx    add files / clear all / show tracks / fill loops toggle
  └─ FileUploadDialog    shown on first load if no tracks

lib/mapStore.ts          module-level singleton — map instance, worker ref, fog data, track list
workers/fogWorker.ts     ALL geometry: simplify → buffer → union/difference → emit fog polygon
lib/parsers/
  index.ts               routes by extension
  gpx.ts                 DOMParser + @tmcw/togeojson (main thread only — DOMParser not in workers)
  fit.ts                 fit-file-parser parseAsync (main thread)
```

## Fog algorithm

1. Main thread parses files → `ParsedTrack[]` (unified type, format-agnostic)
2. Sent to worker via `postMessage({ type: "PROCESS_TRACKS", tracks, mode })`
3. Worker: `simplify → buffer` per track, accumulated into `pendingBuffer` (corridor) or `accumulated` (fill)
4. Every 300 ms: flush pending into fog polygon via `@turf/difference`, emit `FOG_UPDATE { fogData }`
5. MapView calls `fogSource.setData(msg.fogData)` — the fog IS the GeoJSON, sent directly

### Corridor vs Fill mode

| | Corridor (default) | Fill |
|---|---|---|
| Worker state | `fogPolygon` + `pendingBuffer` | `accumulated` (persistent across emits) |
| How applied | `difference(fog, pendingBuffer)` per emit | `difference(worldFog, stripInnerRings(accumulated))` per emit |
| Loop behavior | Only 50m corridor cleared | Interior of closed loops also cleared |
| Multi-file loops | Corridors only | Detected — `accumulated` holds all tracks |

`stripInnerRings` removes inner rings from the union polygon, turning an annulus into a filled disk.

## Key gotchas

**FIT coordinates**: `fit-file-parser` already returns degrees — do NOT multiply by `180/2^31`. Pre-GPS-lock records have near-zero coordinates; filter with `Math.abs(lat) < 0.001 && Math.abs(lng) < 0.001`.

**Worker URL**: must use relative path `"../workers/fogWorker.ts"` in `new Worker()` — the `~` alias does NOT work for worker URLs (only for imports inside worker files, covered by vite.config.ts `worker.plugins`).

**`map.loaded()` is unreliable**: returns false while `setData()` is running. Use `mapStore.sourcesReady` flag (set in `map.once("load")`) as the guard for all source operations.

**`@turf/union` v7 API**: takes a FeatureCollection, not two separate arguments — `union(featureCollection([a, b]))`.

**`@turf/difference` v7 API**: same — `difference(featureCollection([a, b]))` = a minus b.

**Single useFetcher**: all form submissions go through one `useFetcher` in `home.tsx`; results in `fetcher.data`. Children receive callbacks, not their own fetcher instances.

**Mode change triggers reprocess**: toggling corridor/fill in the UI sends RESET then re-sends all `mapStore.tracks` with the new mode. `mapStore.tracks` persists across resets so it can be replayed.

## File format support

| Format | Parser | Notes |
|---|---|---|
| `.gpx` | `@tmcw/togeojson` | Handles LineString + MultiLineString features |
| `.fit` | `fit-file-parser` v3 | Returns degrees directly, filter near-(0,0) records |

To add a new format: create `app/lib/parsers/newformat.ts` + one line in `parsers/index.ts`. Worker, clientAction, and UI are untouched.

## Constants (`app/constants/fog.ts`)

```ts
FOG_CLEAR_RADIUS_METERS = 100   // buffer radius around each track
FOG_EMIT_INTERVAL_MS    = 300   // max fog update frequency
SIMPLIFY_TOLERANCE      = 0.00005  // ~5m at equator (Ramer-Douglas-Peucker)
MAP_STYLE_URL           = "https://tiles.openfreemap.org/styles/liberty"
FOG_COLOR               = "#0a0a1e"
FOG_OPACITY             = 0.8
TRACK_COLOR             = "#ff6b35"
```
