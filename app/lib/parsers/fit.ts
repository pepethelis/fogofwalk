import FitParser from "fit-file-parser"
import type { ParsedTrack, TrackCoords } from "~/types/tracks"

export async function parseFitFile(file: File): Promise<ParsedTrack[]> {
  const buffer = await file.arrayBuffer()
  const parser = new FitParser({ force: true, speedUnit: "m/s" })
  const data = await parser.parseAsync(buffer)
  // fit-file-parser already returns position_lat/long in degrees
  const coords = (data.records ?? [])
    .filter((r) => {
      const lat = r.position_lat
      const lng = r.position_long
      if (lat == null || lng == null) return false
      // Drop pre-GPS-lock records clustered near null island
      if (Math.abs(lat as number) < 0.001 && Math.abs(lng as number) < 0.001) return false
      return true
    })
    .map(
      (r) => [r.position_long as number, r.position_lat as number] as [number, number],
    ) as TrackCoords
  if (coords.length < 2) return []
  return [
    {
      id: crypto.randomUUID(),
      name: file.name,
      coordinates: coords,
      format: "fit",
    },
  ]
}
