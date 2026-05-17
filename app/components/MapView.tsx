import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import { Protocol } from "pmtiles"
import bbox from "@turf/bbox"
import { featureCollection, lineString } from "@turf/helpers"
import "maplibre-gl/dist/maplibre-gl.css"
import { mapStore, worldFogGeoJSON } from "~/lib/mapStore"
import {
  MAP_STYLE_URL,
  FOG_COLOR,
  FOG_OPACITY,
  TRACK_COLOR,
} from "~/constants/fog"
import type { WorkerOutboundMessage } from "~/types/tracks"

const pmtilesProtocol = new Protocol()
maplibregl.addProtocol("pmtiles", pmtilesProtocol.tile.bind(pmtilesProtocol))

interface MapViewProps {
  onMapReady?: () => void
  onProcessingUpdate?: (count: number, done: boolean) => void
  showTracks: boolean
}

export function MapView({
  onMapReady,
  onProcessingUpdate,
  showTracks,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Keep a ref to the latest callback to avoid stale closures in the worker handler
  const onProcessingUpdateRef = useRef(onProcessingUpdate)
  onProcessingUpdateRef.current = onProcessingUpdate

  useEffect(() => {
    if (!containerRef.current || mapStore.map) return

    const rect = containerRef.current.getBoundingClientRect()
    console.debug("[MapView] container dimensions at mount", {
      width: rect.width,
      height: rect.height,
    })

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [15, 50],
      zoom: 4,
      attributionControl: { compact: true },
    })
    mapStore.map = map

    map.once("load", () => {
      console.debug("[MapView] map load event fired")

      // Ensure the map fills its container after layout is complete
      map.resize()

      map.addSource("fog-source", {
        type: "geojson",
        data: worldFogGeoJSON(),
      })
      map.addLayer({
        id: "fog-layer",
        type: "fill",
        source: "fog-source",
        paint: {
          "fill-color": FOG_COLOR,
          "fill-opacity": FOG_OPACITY,
        },
      })
      console.debug("[MapView] fog layer added")

      map.addSource("tracks-source", {
        type: "geojson",
        data: featureCollection([]),
      })
      map.addLayer({
        id: "tracks-layer",
        type: "line",
        source: "tracks-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: "visible",
        },
        paint: {
          "line-color": TRACK_COLOR,
          "line-width": 2,
          "line-opacity": 0.85,
        },
      })
      console.debug("[MapView] tracks layer added")

      mapStore.sourcesReady = true
      onMapReady?.()
    })

    return () => {
      mapStore.sourcesReady = false
      mapStore.map = null
      map.remove()
    }
  }, [])

  useEffect(() => {
    if (!mapStore.worker) {
      console.debug("[MapView] worker not ready when setting up onmessage")
      return
    }
    console.debug("[MapView] setting up worker onmessage handler")

    mapStore.worker.onmessage = (e: MessageEvent<WorkerOutboundMessage>) => {
      const msg = e.data
      const map = mapStore.map

      if (!map || !mapStore.sourcesReady) {
        console.debug(
          "[MapView] message dropped — sources not ready, type=",
          msg.type
        )
        return
      }

      if (msg.type === "FOG_UPDATE") {
        console.debug("[MapView] FOG_UPDATE", { processedCount: msg.processedCount })
        mapStore.fogData = msg.fogData
        const fogSource = map.getSource(
          "fog-source"
        ) as maplibregl.GeoJSONSource
        fogSource?.setData(msg.fogData)

        const trackFeatures = mapStore.tracks.map((t) =>
          lineString(t.coordinates, { name: t.name })
        )

        console.log({ trackFeatures })

        const tracksSource = map.getSource(
          "tracks-source"
        ) as maplibregl.GeoJSONSource
        tracksSource?.setData(featureCollection(trackFeatures))

        onProcessingUpdateRef.current?.(msg.processedCount, false)
      }

      if (msg.type === "DONE") {
        console.debug("[MapView] DONE", { processedCount: msg.processedCount })
        onProcessingUpdateRef.current?.(msg.processedCount, true)

        if (mapStore.tracks.length > 0) {
          const fc = featureCollection(
            mapStore.tracks.map((t) => lineString(t.coordinates))
          )
          const [minLng, minLat, maxLng, maxLat] = bbox(fc)
          if (isFinite(minLng) && isFinite(minLat)) {
            console.debug("[MapView] fitting bounds to all tracks", {
              trackCount: mapStore.tracks.length,
            })
            map.fitBounds(
              [
                [minLng, minLat],
                [maxLng, maxLat],
              ],
              { padding: 60, maxZoom: 14 }
            )
          }
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!mapStore.sourcesReady) return
    console.debug("[MapView] toggling tracks visibility", showTracks)
    mapStore.map?.setLayoutProperty(
      "tracks-layer",
      "visibility",
      showTracks ? "visible" : "none"
    )
  }, [showTracks])

  return <div ref={containerRef} className="absolute inset-0 h-screen" />
}
