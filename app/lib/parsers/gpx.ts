import { gpx } from "@tmcw/togeojson"
import type { ParsedTrack, TrackCoords } from "~/types/tracks"

export async function parseGpxFile(file: File): Promise<ParsedTrack[]> {
  const text = await file.text()
  const dom = new DOMParser().parseFromString(text, "text/xml")
  const geo = gpx(dom)

  const tracks: ParsedTrack[] = []
  for (const feat of geo.features) {
    if (!feat.geometry) continue
    if (feat.geometry.type === "LineString") {
      const coords = feat.geometry.coordinates as TrackCoords
      if (coords.length > 1) {
        tracks.push({
          id: crypto.randomUUID(),
          name: file.name,
          coordinates: coords,
          format: "gpx",
        })
      }
    } else if (feat.geometry.type === "MultiLineString") {
      feat.geometry.coordinates.forEach((coords, i) => {
        if (coords.length > 1) {
          tracks.push({
            id: crypto.randomUUID(),
            name: `${file.name}[${i}]`,
            coordinates: coords as TrackCoords,
            format: "gpx",
          })
        }
      })
    }
  }
  return tracks
}
