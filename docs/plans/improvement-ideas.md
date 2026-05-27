# Fog of Walk — Improvement Ideas

> **Context:** The app is a feature-complete MVP. This document captures brainstormed ideas for
> what to build next. Target users span runners, cyclists, hikers, city explorers, and travel
> photographers. The visual philosophy is to keep the fog binary (no heatmaps). The architecture
> is browser-only today, with an optional backend possible later.

---

## 1. Global Stats Dashboard (`/stats` route) — HIGH PRIORITY

A separate full-page route (not a panel) showing aggregate statistics across all imported tracks.

**Lifetime totals**
- Total distance, total elevation gain, total active days, number of tracks

**Time-series charts**
- Weekly km bar chart
- Monthly elevation chart
- Per-year activity summary (useful for people with years of Strava exports)

**Streaks**
- Current active streak (consecutive days with at least one track)
- Longest streak ever

**Personal records**
- Longest single activity
- Most elevation in a single day
- Biggest single-day exploration (most new ground)

**Unique distance stat** _(Wandrer-inspired)_
- Lifetime km traveled on *new* ground only — this stat only grows when a new track covers area not
  already in the existing fog polygon
- Computed by clipping each new import against the existing explored region with `@turf/difference`
  and summing the non-overlapping segment lengths
- Shown alongside total distance: e.g. `1,234 km total · 876 km unique`

---

## 2. Per-Track Deletion — HIGH IMPACT / MEDIUM EFFORT

Currently the only way to remove a bad import is to clear all data. Individual track deletion would
fix this.

**Implementation sketch**
- "Remove" button in the track stats panel
- `deleteTrack(id)` in `lib/storage.ts` (IDB delete from `tracks` store)
- Remove from `mapStore.tracks`, send `RESET` to worker, replay remaining tracks
- Fog cache is invalidated on deletion

---

## 3. Unique Distance Tracking (Wandrer-inspired) — MEDIUM COMPLEXITY

On each file import, measure how much of the new track was *new ground* vs. already explored.

**How it works**
- After fog computation, clip the new track's buffer against the existing fog polygon using
  `@turf/difference`
- Measure the area/length of the non-overlapping portion
- Store `uniqueKm` per track alongside `distanceKm` in `ParsedTrack`

**Where it shows**
- Track stats panel: "New ground: X km (Y%)"
- Stats dashboard: lifetime unique km

> Note: this is conceptually the inverse of fog computation — instead of carving the fog polygon,
> we measure what *would* be carved for the first time.

---

## 4. Activity Filtering & Sorting — MEDIUM PRIORITY

**Filtering**
- Date-range filter (slider or calendar picker in the control panel)
- Filter by inferred activity type (Run / Walk / Cycle / Hike)

**Sorting**
- Sort tracks by: date (newest/oldest), distance, elevation gain, name

**Activity type inference**
- Classify automatically based on avg speed + distance heuristics
  (e.g., >20 km/h avg → Cycle; >5 km/h avg + >10 km → Run; <5 km/h → Walk/Hike)
- Show type icon next to track name in the stats panel

---

## 5. Customizable Fog Radius — MEDIUM PRIORITY

The corridor width is currently hardcoded at 100 m (`FOG_CLEAR_RADIUS_METERS`). Different
activities naturally explore at different widths.

**UI**: slider in the control panel with labeled presets:
- Foot: 50 m
- Default: 100 m
- Cycling: 150 m

**Implementation**
- Persist chosen radius in IDB prefs alongside `fogMode`
- Changing the radius invalidates the fog cache → triggers a full reprocess

---

## 6. Additional File Format Support — LOW EFFORT

`@tmcw/togeojson` (already a dependency) supports TCX and KML in addition to GPX.

- **TCX** (Garmin legacy): add `parsers/tcx.ts`, route `.tcx` extension in `parsers/index.ts`
- **KML**: add `parsers/kml.ts`, route `.kml` extension

Both would follow the same pattern as the GPX parser: extract coordinates, elevation, and
timestamps from the togeojson output.

---

## 7. Elevation Smoothing — LOW EFFORT

Raw GPS elevation data is noisy, causing spiky profiles and inflated gain/loss numbers.

**Fix**: apply a 5-point moving-average to elevation before accumulating gain/loss in
`computeStats()` (`lib/stats.ts`). The smoothed array is used only for stats; raw coordinates
are kept for the map.

---

## 8. Export — MEDIUM PRIORITY

Both exports are browser-side downloads with no backend required.

- **Stats CSV**: all track metadata (name, date, distance, elevation, duration, pace) as a
  spreadsheet-friendly file
- **Fog GeoJSON**: the current fog polygon exported as `.geojson` for use in QGIS, Felt,
  or other mapping tools

---

## 9. Copy Track Name Button — LOW EFFORT (QUICK WIN)

Track names can be long and are truncated in the `CardTitle`. A copy button lets users grab the
full name without scrolling or inspecting.

**Implementation** (`app/components/TrackStatsPanel.tsx`)
- Add a `Copy` icon button in `CardAction` (between Share and Close)
- `onClick`: `navigator.clipboard.writeText(track.name)`
- Visual feedback: icon swaps to `Check` for 1.5 s, then reverts (local `useState` + `setTimeout`)
- Both icons available in `@phosphor-icons/react` (already installed)

---

## 10. Map UX Improvements — MEDIUM PRIORITY

- **Keyboard shortcuts**: `T` toggle tracks · `F` toggle fog · `L` fill loops · `?` open help
- **"Fly to track" button**: clicking a track in the stats panel animates the map to fit that
  track's bounds
- **Minimap / overview**: small inset map showing the global extent of all explored area
- **Track list panel**: a persistent left sidebar listing all tracks with inline search and filter,
  replacing the current click-on-map-only discovery pattern

---

## 11. Mobile / PWA Improvements — MEDIUM PRIORITY

- **PWA manifest + service worker**: allow "Add to Home Screen" on iOS/Android for offline map
  viewing
- **iOS Share Sheet integration**: accept `.gpx` / `.fit` files shared from Strava, Garmin, or the
  Files app via the Web Share Target API (bypasses the in-app browser limitation documented in help)
- **Touch-optimized controls**: larger hit targets, swipe-to-dismiss for draggable panels

---

## 12. Performance & Reliability Improvements — LOW PRIORITY

- **Fog cache versioning**: store a hash of `(trackIds + fogMode + fogRadius)` so the cache is
  invalidated correctly when the radius setting changes (current check is ID-set-only)
- **Worker error surfacing**: propagate exceptions from `fogWorker.ts` to the UI via a toast or
  error boundary instead of silent `console.warn`
- **IDB migration path**: implement `onupgradeneeded` versioning so new prefs fields can be added
  in future without data loss

---

## 13. Backend / Cloud (Future) — OPTIONAL BACKEND

Features that would require an optional server component. Privacy-first: keep local-only as the
default.

- **Cloud sync**: store tracks + fog in a user account; access from multiple devices
- **Public fog map**: shareable read-only URL of your fog map (opt-in; privacy toggle between
  showing fog outline only vs. full track paths)
- **Multi-user merge**: combine fog maps with friends or family to see collective exploration
- **Leaderboards**: opt-in ranking by unique km, total km, elevation, or city coverage
