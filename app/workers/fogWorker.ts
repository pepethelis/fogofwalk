/// <reference lib="webworker" />

import buffer from "@turf/buffer"
import simplify from "@turf/simplify"
import union from "@turf/union"
import difference from "@turf/difference"
import { lineString, polygon, featureCollection } from "@turf/helpers"
import type { Feature, Polygon, MultiPolygon } from "geojson"
import type { FogMode, WorkerInboundMessage, WorkerOutboundMessage } from "~/types/tracks"
import {
  FOG_CLEAR_RADIUS_METERS,
  FOG_EMIT_INTERVAL_MS,
  SIMPLIFY_TOLERANCE,
} from "~/constants/fog"

type FogFeature = Feature<Polygon | MultiPolygon>

function worldFog(): Feature<Polygon> {
  return polygon([[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]])
}

// For fill mode: remove inner rings so a closed-loop buffer becomes a filled polygon.
// @turf/buffer on a looping line returns an annulus; stripping inner rings forces fill behavior.
function stripInnerRings(feat: FogFeature): FogFeature {
  const geo = feat.geometry
  if (geo.type === "Polygon") {
    return geo.coordinates.length <= 1
      ? feat
      : { ...feat, geometry: { type: "Polygon", coordinates: [geo.coordinates[0]] } }
  }
  return {
    ...feat,
    geometry: { type: "MultiPolygon", coordinates: geo.coordinates.map((p) => [p[0]]) },
  }
}

let fogPolygon: FogFeature = worldFog()
// Buffers accumulated since the last fog update — applied in one batch at emit time.
let pendingBuffer: FogFeature | null = null
let processedCount = 0
let lastEmitTime = 0

function flushAndEmit() {
  if (pendingBuffer) {
    fogPolygon = difference(featureCollection([fogPolygon, pendingBuffer])) ?? fogPolygon
    pendingBuffer = null
  }
  const msg: WorkerOutboundMessage = { type: "FOG_UPDATE", fogData: fogPolygon, processedCount }
  self.postMessage(msg)
  lastEmitTime = performance.now()
}

self.onmessage = (e: MessageEvent<WorkerInboundMessage>) => {
  const msg = e.data

  if (msg.type === "RESET") {
    fogPolygon = worldFog()
    pendingBuffer = null
    processedCount = 0
    lastEmitTime = 0
    self.postMessage({
      type: "FOG_UPDATE",
      fogData: worldFog(),
      processedCount: 0,
    } as WorkerOutboundMessage)
    return
  }

  if (msg.type === "PROCESS_TRACKS") {
    const { tracks, mode } = msg
    console.debug("[worker] PROCESS_TRACKS", { count: tracks.length, mode })

    for (const track of tracks) {
      const validCoords = track.coordinates.filter(
        ([lng, lat]) =>
          isFinite(lng) &&
          isFinite(lat) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180 &&
          (Math.abs(lat) > 0.001 || Math.abs(lng) > 0.001),
      )
      if (validCoords.length < 2) {
        console.debug("[worker] skipping track with < 2 valid coords", track.name)
        processedCount++
        continue
      }

      try {
        const line = lineString(validCoords)
        const simplified = simplify(line, {
          tolerance: SIMPLIFY_TOLERANCE,
          highQuality: false,
          mutate: true,
        })
        const buf = buffer(simplified, FOG_CLEAR_RADIUS_METERS, { units: "meters" })
        if (buf) {
          // Corridor: use buffer as-is — @turf/buffer returns an annulus for closed loops,
          // so difference correctly clears only the path corridor.
          // Fill: strip inner rings to force the annulus into a filled polygon.
          const trackBuf = mode === "fill"
            ? stripInnerRings(buf as FogFeature)
            : (buf as FogFeature)

          pendingBuffer = pendingBuffer
            ? (union(featureCollection([pendingBuffer, trackBuf])) ?? pendingBuffer)
            : trackBuf
        }
      } catch (err) {
        console.debug("[worker] error processing track", track.name, err)
      }

      processedCount++
      if (performance.now() - lastEmitTime >= FOG_EMIT_INTERVAL_MS) {
        flushAndEmit()
      }
    }

    flushAndEmit()
    const doneMsg: WorkerOutboundMessage = { type: "DONE", processedCount }
    console.debug("[worker] DONE", { processedCount })
    self.postMessage(doneMsg)
  }
}
