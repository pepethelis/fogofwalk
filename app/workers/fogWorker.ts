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
  TRACK_SIMPLIFY_TOLERANCE,
  BUFFER_STEPS,
} from "~/constants/fog"

type FogFeature = Feature<Polygon | MultiPolygon>

function worldFog(): Feature<Polygon> {
  return polygon([[[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]]])
}

// Removes inner rings from a polygon/multipolygon so that a closed-loop buffer
// becomes a filled shape. Used in fill mode to clear loop interiors.
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

// Corridor mode: fog maintained incrementally via difference
let fogPolygon: FogFeature = worldFog()
// Corridor mode: track buffers batched since last emit, applied once per flush
let pendingBuffer: FogFeature | null = null
// Fill mode: cumulative union of ALL track buffers since last RESET.
// Never cleared between emits so loops formed across any number of files are detected.
let accumulated: FogFeature | null = null

let processedCount = 0
let lastEmitTime = 0

function flushAndEmit(mode: FogMode) {
  if (mode === "corridor") {
    if (pendingBuffer) {
      fogPolygon = difference(featureCollection([fogPolygon, pendingBuffer])) ?? fogPolygon
      pendingBuffer = null
    }
  } else {
    // Recompute fog from the full accumulated union each time, stripping inner rings
    // at the last moment. This catches loops formed by any combination of files/batches.
    fogPolygon = accumulated
      ? difference(featureCollection([worldFog(), stripInnerRings(accumulated)])) ?? worldFog()
      : worldFog()
  }

  // Simplify the output before sending to reduce postMessage payload size and the
  // vertex count that MapLibre must index and render. We do NOT mutate fogPolygon
  // itself — it is used as the base polygon for the next difference() call.
  let fogToEmit: FogFeature
  try {
    fogToEmit =
      (simplify(fogPolygon, {
        tolerance: SIMPLIFY_TOLERANCE,
        highQuality: false,
        mutate: false,
      }) as FogFeature) ?? fogPolygon
  } catch {
    fogToEmit = fogPolygon
  }

  const msg: WorkerOutboundMessage = { type: "FOG_UPDATE", fogData: fogToEmit, processedCount }
  self.postMessage(msg)
  lastEmitTime = performance.now()
}

self.onmessage = (e: MessageEvent<WorkerInboundMessage>) => {
  const msg = e.data

  if (msg.type === "RESET") {
    fogPolygon = worldFog()
    pendingBuffer = null
    accumulated = null
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
          tolerance: TRACK_SIMPLIFY_TOLERANCE,
          highQuality: false,
          mutate: true,
        })
        const buf = buffer(simplified, FOG_CLEAR_RADIUS_METERS, {
          units: "meters",
          steps: BUFFER_STEPS,
        })
        if (buf) {
          if (mode === "corridor") {
            pendingBuffer = pendingBuffer
              ? (union(featureCollection([pendingBuffer, buf as FogFeature])) ?? pendingBuffer)
              : (buf as FogFeature)
          } else {
            // Accumulate without stripping — inner rings are preserved so the
            // full union can detect loops formed across multiple files.
            accumulated = accumulated
              ? (union(featureCollection([accumulated, buf as FogFeature])) ?? accumulated)
              : (buf as FogFeature)
          }
        }
      } catch (err) {
        console.debug("[worker] error processing track", track.name, err)
      }

      processedCount++
      if (performance.now() - lastEmitTime >= FOG_EMIT_INTERVAL_MS) {
        flushAndEmit(mode)
      }
    }

    flushAndEmit(mode)
    const doneMsg: WorkerOutboundMessage = { type: "DONE", processedCount }
    console.debug("[worker] DONE", { processedCount })
    self.postMessage(doneMsg)
  }
}
