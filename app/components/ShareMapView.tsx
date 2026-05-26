import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import type { ParsedTrack } from "~/types/tracks"
import { MAP_STYLE_URL, TRACK_COLOR } from "~/constants/fog"
import { CARD_WIDTH, CARD_HEIGHT } from "~/lib/shareCard"

interface ShareMapViewProps {
  track: ParsedTrack
  onReady: (baseMap: ImageBitmap, trackPoints: { x: number; y: number }[]) => void
}

/**
 * Renders a clean MapLibre map (no fog, no other tracks) centred on the given
 * track and calls onReady once the map is fully captured.
 *
 * Two-phase capture:
 * 1. After the base tiles are idle (track layer NOT yet added): capture the base
 *    map bitmap. This bitmap is safe to blur without blurring the track.
 * 2. Add the track layer, wait for the second idle, then project track
 *    coordinates to canvas pixels via map.project(). These pixel coords are
 *    drawn unblurred on top of the blurred base map in drawShareCard.
 *
 * The container is positioned off-screen so the map renders without being
 * visible to the user. WebGL still renders correctly when off-screen as long
 * as the element has real dimensions.
 */
export function ShareMapView({ track, onReady }: ShareMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Keep a stable ref to onReady to avoid re-creating the map on every render
  const onReadyRef = useRef(onReady)
  useEffect(() => {
    onReadyRef.current = onReady
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const map = new maplibregl.Map({
      container,
      style: MAP_STYLE_URL,
      canvasContextAttributes: { preserveDrawingBuffer: true },
      attributionControl: false,
    })

    let captured = false

    // 10-second fallback in case the map never reaches idle (e.g. offline)
    const fallbackTimer = setTimeout(() => {
      if (captured) return
      captured = true
      console.warn("[ShareMapView] map did not reach idle within 10 s — emitting partial capture")
      // Best-effort: emit whatever we have (empty bitmap fallback, no track points)
      const canvas = map.getCanvas()
      createImageBitmap(canvas).then((bitmap) => {
        onReadyRef.current(bitmap, [])
      })
    }, 10_000)

    map.once("load", () => {
      // ── Compute track bounds ──────────────────────────────────────────────
      const lngs = track.coordinates.map((c) => c[0])
      const lats = track.coordinates.map((c) => c[1])
      const bounds: maplibregl.LngLatBoundsLike = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ]

      // Asymmetric padding: reserve bottom ~520px for the stats panel so the
      // track's bounding box stays in the upper portion of the card.
      map.fitBounds(bounds, {
        padding: { top: 100, bottom: 520, left: 80, right: 80 },
        animate: false,
      })

      // ── Phase 1: base map idle (no track layer yet) ───────────────────────
      map.once("idle", async () => {
        if (captured) return

        // Capture the base map before the track layer is added.
        // This bitmap will be blurred in drawShareCard without blurring the track.
        const baseMapBitmap = await createImageBitmap(map.getCanvas())

        // ── Add track source & layer ────────────────────────────────────────
        map.addSource("share-track", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: track.coordinates as [number, number][],
            },
            properties: {},
          },
        })

        map.addLayer({
          id: "share-track-line",
          type: "line",
          source: "share-track",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": TRACK_COLOR,
            "line-width": 4,
            "line-opacity": 0.95,
          },
        })

        // ── Phase 2: track layer idle → project coordinates ─────────────────
        map.once("idle", () => {
          if (captured) return
          captured = true
          clearTimeout(fallbackTimer)

          // Subsample for performance on very long tracks (same limit as drawRoute)
          const MAX_PTS = 2000
          const coords = track.coordinates
          const step =
            coords.length > MAX_PTS ? Math.ceil(coords.length / MAX_PTS) : 1
          const trackPoints = coords
            .filter((_, i) => i % step === 0)
            .map(([lng, lat]) => {
              const pt = map.project([lng, lat] as [number, number])
              return { x: pt.x, y: pt.y }
            })

          onReadyRef.current(baseMapBitmap, trackPoints)
        })
      })
    })

    return () => {
      clearTimeout(fallbackTimer)
      map.remove()
    }
  }, [track])

  return (
    <div
      ref={containerRef}
      aria-hidden
      style={{
        position: "fixed",
        left: -9999,
        top: -9999,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        pointerEvents: "none",
      }}
    />
  )
}
