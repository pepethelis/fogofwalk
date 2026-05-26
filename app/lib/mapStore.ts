import type maplibregl from "maplibre-gl"
import type { ParsedTrack, FogMode } from "~/types/tracks"

interface MapStore {
  map: maplibregl.Map | null
  worker: Worker | null
  fogData: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null
  tracks: ParsedTrack[]
  isProcessing: boolean
  processedCount: number
  sourcesReady: boolean
  /** Current fog mode — kept in sync with React state so MapView can read it without a prop. */
  fogMode: FogMode
  /** Map center restored from storage; used once by MapView on initialization. */
  initialCenter: [number, number] | null
  /** Map zoom restored from storage; used once by MapView on initialization. */
  initialZoom: number | null
  /**
   * True when tracks were restored but the fog cache was stale, triggering a
   * worker reprocess. MapView skips fitBounds in this case so the saved map
   * position is preserved.
   */
  isRestoreReprocess: boolean
}

export const mapStore: MapStore = {
  map: null,
  worker: null,
  fogData: null,
  tracks: [],
  isProcessing: false,
  processedCount: 0,
  sourcesReady: false,
  fogMode: "corridor",
  initialCenter: null,
  initialZoom: null,
  isRestoreReprocess: false,
}

export function worldFogGeoJSON(): GeoJSON.Feature<GeoJSON.Polygon> {
  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-180, -90],
          [180, -90],
          [180, 90],
          [-180, 90],
          [-180, -90],
        ],
      ],
    },
    properties: {},
  }
}
