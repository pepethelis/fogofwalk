/// <reference lib="webworker" />

import buffer from "@turf/buffer"
import simplify from "@turf/simplify"
import union from "@turf/union"
import { lineString, featureCollection } from "@turf/helpers"
import type { Feature, Polygon, MultiPolygon, Position } from "geojson"
import type { WorkerInboundMessage, WorkerOutboundMessage } from "~/types/tracks"
import { FOG_CLEAR_RADIUS_METERS, FOG_EMIT_INTERVAL_MS, SIMPLIFY_TOLERANCE } from "~/constants/fog"

type UnionResult = Feature<Polygon | MultiPolygon> | null

let accumulated: UnionResult = null
let processedCount = 0
let lastEmitTime = 0

// The accumulated union is the "cleared area" polygon.
// Its outer rings become inner rings (holes) of the world fog polygon.
// We do NOT want inner rings of the union — those would be islands of fog
// inside cleared areas, which don't exist for simple buffered tracks.
function extractHoles(feat: UnionResult): Position[][] {
  if (!feat) return []
  const { geometry } = feat
  if (geometry.type === "Polygon") {
    return [geometry.coordinates[0] as Position[]]
  }
  return geometry.coordinates.map((poly) => poly[0] as Position[])
}

function emitFogUpdate() {
  const holes = extractHoles(accumulated)
  console.debug("[worker] emitFogUpdate", { processedCount, holeCount: holes.length, holeVertices: holes.reduce((s, h) => s + h.length, 0) })
  const msg: WorkerOutboundMessage = {
    type: "FOG_UPDATE",
    holes,
    processedCount,
  }
  self.postMessage(msg)
  lastEmitTime = performance.now()
}

self.onmessage = (e: MessageEvent<WorkerInboundMessage>) => {
  const msg = e.data

  if (msg.type === "RESET") {
    console.debug("[worker] RESET")
    accumulated = null
    processedCount = 0
    lastEmitTime = 0
    emitFogUpdate()
    return
  }

  if (msg.type === "PROCESS_TRACKS") {
    console.debug("[worker] PROCESS_TRACKS received", { count: msg.tracks.length })
    for (const track of msg.tracks) {
      const validCoords = track.coordinates.filter(
        ([lng, lat]) =>
          isFinite(lng) && isFinite(lat) &&
          lat >= -90 && lat <= 90 &&
          lng >= -180 && lng <= 180 &&
          (Math.abs(lat) > 0.001 || Math.abs(lng) > 0.001)
      )
      if (validCoords.length < 2) {
        console.debug("[worker] skipping track with < 2 valid coords", track.name, { original: track.coordinates.length, valid: validCoords.length })
        continue
      }
      try {
        const line = lineString(validCoords)
        const simplified = simplify(line, {
          tolerance: SIMPLIFY_TOLERANCE,
          highQuality: false,
          mutate: true,
        })
        const buffered = buffer(simplified, FOG_CLEAR_RADIUS_METERS, {
          units: "meters",
        })
        if (buffered) {
          accumulated = accumulated
            ? (union(featureCollection([accumulated, buffered as Feature<Polygon | MultiPolygon>])) ?? accumulated)
            : (buffered as Feature<Polygon | MultiPolygon>)
        } else {
          console.debug("[worker] buffer returned null for track", track.name)
        }
      } catch (err) {
        console.debug("[worker] error processing track", track.name, err)
      }
      processedCount++
      if (performance.now() - lastEmitTime >= FOG_EMIT_INTERVAL_MS) {
        emitFogUpdate()
      }
    }

    // Final fog state first, then signal completion
    emitFogUpdate()
    const doneMsg: WorkerOutboundMessage = { type: "DONE", processedCount }
    console.debug("[worker] DONE", { processedCount })
    self.postMessage(doneMsg)
  }
}
