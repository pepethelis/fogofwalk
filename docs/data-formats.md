# Data Formats

## Unified Track Type

All activity formats are converted to `ParsedTrack` before any geometry processing:

```typescript
interface ParsedTrack {
  id: string           // crypto.randomUUID()
  name: string         // original filename
  coordinates: [number, number][]  // [longitude, latitude] pairs
  format: "gpx" | "fit"
}
```

Coordinates are always `[longitude, latitude]` (GeoJSON convention, not lat/lng).

## Supported Formats

### GPX

- Parsed with `@tmcw/togeojson` using `DOMParser` (main thread only)
- `Track` and `Route` elements → `LineString` / `MultiLineString` features
- Each segment of a `MultiLineString` becomes a separate `ParsedTrack`
- `<trkpt>` coordinates are already in decimal degrees

### FIT

- Parsed with `fit-file-parser` `parseAsync` (main thread)
- `record` messages contain `position_lat` and `position_long`
- Stored as 32-bit signed integers in **semicircles**: `degrees = value × (180 / 2³¹)`
- Records without GPS coordinates are filtered out
- All records from one file become a single `ParsedTrack`

## Adding a New Format

1. Create `app/lib/parsers/<format>.ts` exporting `async function parse<Format>File(file: File): Promise<ParsedTrack[]>`
2. Add one `if (ext === "<ext>") return parse<Format>File(file)` line in `app/lib/parsers/index.ts`

No other files need to change.
