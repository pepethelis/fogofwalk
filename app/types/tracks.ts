export type TrackCoords = [number, number][]

export interface ParsedTrack {
  id: string
  name: string
  coordinates: TrackCoords
  format: "gpx" | "fit"
}

export type WorkerInboundMessage =
  | { type: "PROCESS_TRACKS"; tracks: ParsedTrack[] }
  | { type: "RESET" }

export type WorkerOutboundMessage =
  | { type: "FOG_UPDATE"; holes: GeoJSON.Position[][]; processedCount: number }
  | { type: "ERROR"; file: string; message: string }
  | { type: "DONE"; processedCount: number }
