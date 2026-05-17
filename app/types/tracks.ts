export type TrackCoords = [number, number][]

export interface ElevationPoint {
  distanceKm: number
  elevationM: number
}

export interface TrackStats {
  distanceKm: number
  elevationGainM: number
  elevationLossM: number
  hasElevation: boolean
  durationMs: number | null
  movingTimeMs: number | null
  avgPaceMinPerKm: number | null
  avgMoovingPaceMinPerKm: number | null
  avgSpeedKmh: number | null
  avgMoovingSpeedKmh: number | null
  elevationProfile: ElevationPoint[]
}

export interface ParsedTrack {
  id: string
  name: string
  coordinates: TrackCoords
  format: "gpx" | "fit"
  stats: TrackStats
}

export type FogMode = "corridor" | "fill"

export type WorkerInboundMessage =
  | { type: "PROCESS_TRACKS"; tracks: ParsedTrack[]; mode: FogMode }
  | { type: "RESET" }

export type WorkerOutboundMessage =
  | {
      type: "FOG_UPDATE"
      fogData: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
      processedCount: number
    }
  | { type: "ERROR"; file: string; message: string }
  | { type: "DONE"; processedCount: number }
