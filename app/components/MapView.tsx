import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import type { StyleSpecification } from "maplibre-gl"
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
  TRACK_WIDTH_DEFAULT,
  TRACK_WIDTH_SELECTED,
  TRACK_OPACITY_DEFAULT,
  TRACK_OPACITY_SELECTED,
  TRACK_OPACITY_DIM,
} from "~/constants/fog"
import type { MapMode, WorkerOutboundMessage } from "~/types/tracks"

const pmtilesProtocol = new Protocol()
maplibregl.addProtocol("pmtiles", pmtilesProtocol.tile.bind(pmtilesProtocol))

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "esri-satellite": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    },
  },
  layers: [
    { id: "esri-satellite-layer", type: "raster", source: "esri-satellite" },
  ],
}

function setupMapLayers(map: maplibregl.Map, mode: MapMode): void {
  if (mode === "relief") {
    map.addSource("terrain-source", {
      type: "raster-dem",
      tiles: [
        "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
      ],
      encoding: "terrarium",
      tileSize: 256,
      maxzoom: 14,
    })
    map.setTerrain({ source: "terrain-source", exaggeration: 2.5 })
  }

  if (mode === "flat") {
    map.addSource("fog-source", {
      type: "geojson",
      data: mapStore.fogData ?? worldFogGeoJSON(),
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
  }

  const trackFeatures = mapStore.tracks.map((t) =>
    lineString(t.coordinates, { name: t.name, id: t.id })
  )
  map.addSource("tracks-source", {
    type: "geojson",
    data: featureCollection(trackFeatures),
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

  map.on("mouseenter", "tracks-layer", () => {
    map.getCanvas().style.cursor = "pointer"
  })
  map.on("mouseleave", "tracks-layer", () => {
    map.getCanvas().style.cursor = ""
  })
}

interface MapViewProps {
  onMapReady?: () => void
  onProcessingUpdate?: (count: number, done: boolean) => void
  showTracks: boolean
  selectedTrackId: string | null
  onTrackSelect: (id: string | null) => void
  mapMode: MapMode
}

export function MapView({
  onMapReady,
  onProcessingUpdate,
  showTracks,
  selectedTrackId,
  onTrackSelect,
  mapMode,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onProcessingUpdateRef = useRef(onProcessingUpdate)
  onProcessingUpdateRef.current = onProcessingUpdate
  const onTrackSelectRef = useRef(onTrackSelect)
  onTrackSelectRef.current = onTrackSelect
  const showTracksRef = useRef(showTracks)
  showTracksRef.current = showTracks
  const selectedTrackIdRef = useRef(selectedTrackId)
  selectedTrackIdRef.current = selectedTrackId
  const pendingStyleLoadRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapStore.map) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [15, 50],
      zoom: 5,
      minZoom: 5,
      pitch: 0,
      attributionControl: { compact: true },
    })
    mapStore.map = map

    map.on("click", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["tracks-layer"],
      })
      if (features.length > 0) {
        onTrackSelectRef.current?.(features[0].properties?.id ?? null)
      } else {
        onTrackSelectRef.current?.(null)
      }
    })

    map.once("load", () => {
      map.resize()
      setupMapLayers(map, "flat")
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
    if (!mapStore.worker) return

    mapStore.worker.onmessage = (e: MessageEvent<WorkerOutboundMessage>) => {
      const msg = e.data
      const map = mapStore.map

      if (!map || !mapStore.sourcesReady) return

      if (msg.type === "FOG_UPDATE") {
        mapStore.fogData = msg.fogData
        const fogSource = map.getSource(
          "fog-source"
        ) as maplibregl.GeoJSONSource
        fogSource?.setData(msg.fogData)

        const trackFeatures = mapStore.tracks.map((t) =>
          lineString(t.coordinates, { name: t.name, id: t.id })
        )
        const tracksSource = map.getSource(
          "tracks-source"
        ) as maplibregl.GeoJSONSource
        tracksSource?.setData(featureCollection(trackFeatures))

        onProcessingUpdateRef.current?.(msg.processedCount, false)
      }

      if (msg.type === "DONE") {
        onProcessingUpdateRef.current?.(msg.processedCount, true)

        if (mapStore.tracks.length > 0) {
          const fc = featureCollection(
            mapStore.tracks.map((t) => lineString(t.coordinates))
          )
          const [minLng, minLat, maxLng, maxLat] = bbox(fc)
          if (isFinite(minLng) && isFinite(minLat)) {
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
    const map = mapStore.map
    if (!map || !mapStore.sourcesReady) return

    if (pendingStyleLoadRef.current) {
      map.off("styledata", pendingStyleLoadRef.current)
      pendingStyleLoadRef.current = null
    }

    mapStore.sourcesReady = false
    map.setStyle(mapMode === "flat" ? MAP_STYLE_URL : SATELLITE_STYLE)

    const onStyleData = () => {
      map.off("styledata", onStyleData)
      pendingStyleLoadRef.current = null

      setupMapLayers(map, mapMode)

      map.setLayoutProperty(
        "tracks-layer",
        "visibility",
        showTracksRef.current ? "visible" : "none"
      )

      const sid = selectedTrackIdRef.current
      if (sid) {
        map.setPaintProperty("tracks-layer", "line-width", [
          "case",
          ["==", ["get", "id"], sid],
          TRACK_WIDTH_SELECTED,
          TRACK_WIDTH_DEFAULT,
        ])
        map.setPaintProperty("tracks-layer", "line-opacity", [
          "case",
          ["==", ["get", "id"], sid],
          TRACK_OPACITY_SELECTED,
          TRACK_OPACITY_DIM,
        ])
      }

      map.easeTo({ pitch: mapMode === "flat" ? 0 : 45, duration: 400 })
      mapStore.sourcesReady = true
    }

    pendingStyleLoadRef.current = onStyleData
    map.on("styledata", onStyleData)
  }, [mapMode])

  useEffect(() => {
    if (!mapStore.sourcesReady) return
    mapStore.map?.setLayoutProperty(
      "tracks-layer",
      "visibility",
      showTracks ? "visible" : "none"
    )
  }, [showTracks])

  useEffect(() => {
    if (!mapStore.sourcesReady || !mapStore.map) return
    const map = mapStore.map
    if (!selectedTrackId) {
      map.setPaintProperty("tracks-layer", "line-width", TRACK_WIDTH_DEFAULT)
      map.setPaintProperty(
        "tracks-layer",
        "line-opacity",
        TRACK_OPACITY_DEFAULT
      )
      return
    }
    map.setPaintProperty("tracks-layer", "line-width", [
      "case",
      ["==", ["get", "id"], selectedTrackId],
      TRACK_WIDTH_SELECTED,
      TRACK_WIDTH_DEFAULT,
    ])
    map.setPaintProperty("tracks-layer", "line-opacity", [
      "case",
      ["==", ["get", "id"], selectedTrackId],
      TRACK_OPACITY_SELECTED,
      TRACK_OPACITY_DIM,
    ])
  }, [selectedTrackId])

  return <div ref={containerRef} className="absolute inset-0 h-screen" />
}
