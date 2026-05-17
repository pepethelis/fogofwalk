import type maplibregl from "maplibre-gl"
import type { ParsedTrack } from "~/types/tracks"

interface MapStore {
  map: maplibregl.Map | null
  worker: Worker | null
  fogHoles: GeoJSON.Position[][]
  tracks: ParsedTrack[]
  isProcessing: boolean
  processedCount: number
  sourcesReady: boolean
}

export const mapStore: MapStore = {
  map: null,
  worker: null,
  fogHoles: [],
  tracks: [],
  isProcessing: false,
  processedCount: 0,
  sourcesReady: false,
}

export function buildFogGeoJSON(
  holes: GeoJSON.Position[][],
): GeoJSON.Feature<GeoJSON.Polygon> {
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
        ...holes,
      ],
    },
    properties: {},
  }
}
