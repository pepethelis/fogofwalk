import type { ParsedTrack } from "~/types/tracks"
import { parseGpxFile } from "./gpx"
import { parseFitFile } from "./fit"

export async function parseFile(file: File): Promise<ParsedTrack[]> {
  const ext = file.name.split(".").pop()?.toLowerCase()
  if (ext === "gpx") return parseGpxFile(file)
  if (ext === "fit") return parseFitFile(file)
  throw new Error(`Unsupported format: .${ext}`)
}
