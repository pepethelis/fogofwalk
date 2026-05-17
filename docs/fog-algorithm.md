# Fog Algorithm

## Concept

The map is covered by a semi-transparent fog rendered as a MapLibre GL fill layer. The fog is a single GeoJSON `Polygon` covering the entire world, with "holes" cut out where the user has been.

## Implementation

### Fog Polygon

```
Outer ring: [[-180,-90],[180,-90],[180,90],[-180,90],[-180,-90]]
Inner rings (holes): one per cleared area
```

Each hole is an inner ring in the polygon's `coordinates` array. MapLibre renders fill-rule `nonzero` by default, so holes appear transparent.

### Clearing Process (Web Worker)

For each `ParsedTrack`:

1. **Simplify** coordinates — Douglas-Peucker with `tolerance = 0.00005°` (~5 m at equator). Reduces vertex count before the expensive buffer step.

2. **Buffer** — `@turf/buffer` creates a polygon around the line with radius `FOG_CLEAR_RADIUS_METERS` (50 m). This is the area to clear.

3. **Union** — `@turf/union` merges the new buffer into the accumulated cleared area. Result is a single `Polygon` or `MultiPolygon`.

4. **Emit** — every `FOG_EMIT_INTERVAL_MS` (300 ms) of wall-clock time, extract the inner rings from the accumulated union and send them to the main thread as `holes: Position[][]`.

### Hole Extraction

```
Polygon     → geometry.coordinates.slice(1)          (drop outer ring)
MultiPolygon → concat each polygon's slice(1)
```

### Map Update

Main thread receives `holes: Position[][]` and calls:

```typescript
source.setData(buildFogGeoJSON(holes))
```

`setData` triggers an incremental GPU re-tile, not a full repaint.

## Performance Notes

- Simplification is crucial: a 10 km run might have 2000 GPS points; after simplification ~200.
- The accumulated union grows over time but is bounded by the total explored area.
- Processing ~500 files typically takes 5–30 seconds depending on track length.
- Fog updates are time-gated (not count-gated) so the UI updates at a consistent rate regardless of file size distribution.

## Constants (`app/constants/fog.ts`)

| Constant | Value | Description |
|---|---|---|
| `FOG_CLEAR_RADIUS_METERS` | 50 | Half-width of cleared corridor |
| `FOG_EMIT_INTERVAL_MS` | 300 | Minimum ms between fog updates |
| `SIMPLIFY_TOLERANCE` | 0.00005 | Douglas-Peucker tolerance in degrees |
