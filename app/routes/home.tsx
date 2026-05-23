import { useState, useEffect } from "react"
import { useFetcher, useLoaderData } from "react-router"
import type maplibregl from "maplibre-gl"
import { featureCollection } from "@turf/helpers"
import type { Route } from "./+types/home"
import { MapView } from "~/components/MapView"
import { ControlPanel } from "~/components/ControlPanel"
import { FileUploadDialog } from "~/components/FileUploadDialog"
import { TrackStatsPanel } from "~/components/TrackStatsPanel"
import { PhotoModal } from "~/components/PhotoModal"
import { ErrorBoundary, ErrorCard } from "~/components/ErrorBoundary"
import { mapStore, worldFogGeoJSON } from "~/lib/mapStore"
import { parseFile } from "~/lib/parsers"
import { processPhotoFiles } from "~/lib/photos"
import type { FogMode, MapMode, ParsedTrack } from "~/types/tracks"
import type { PhotoEntry } from "~/types/photos"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Fog of Walk — Explore the unknown" },
    {
      name: "description",
      content:
        "Import your GPX and FIT activity files. Watch the fog of war lift over every trail you've run, every road you've cycled, every path you've ever walked.",
    },
    { property: "og:type", content: "website" },
    { property: "og:title", content: "Fog of Walk" },
    {
      property: "og:description",
      content:
        "Import your GPX and FIT activity files. Watch the fog of war lift over every trail you've run, every road you've cycled, every path you've ever walked.",
    },
    { property: "og:site_name", content: "Fog of Walk" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: "Fog of Walk" },
    {
      name: "twitter:description",
      content:
        "Import your GPX and FIT activity files. Watch the fog of war lift over every trail you've run, every road you've cycled, every path you've ever walked.",
    },
  ]
}

export async function clientLoader(): Promise<{ initialized: boolean }> {
  if (!mapStore.worker) {
    console.debug("[clientLoader] creating worker")
    mapStore.worker = new Worker(
      new URL("../workers/fogWorker.ts", import.meta.url),
      { type: "module" }
    )
    mapStore.worker.onerror = (e) => console.error("[worker] uncaught error", e)
    console.debug("[clientLoader] worker created", mapStore.worker)
  }
  return { initialized: true }
}
clientLoader.hydrate = true as const

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData()
  const intent = formData.get("intent") as string

  if (intent === "add-files") {
    const files = formData.getAll("files") as File[]
    const mode = formData.get("mode") as FogMode
    console.debug("[clientAction] add-files", {
      fileCount: files.length,
      mode,
      files: files.map((f) => f.name),
    })
    const allTracks: ParsedTrack[] = []
    for (const file of files) {
      try {
        const parsed = await parseFile(file)
        console.debug(
          "[clientAction] parsed",
          file.name,
          "→",
          parsed.length,
          "tracks, first track coords:",
          parsed[0]?.coordinates.length
        )
        allTracks.push(...parsed)
      } catch (e) {
        console.warn(`[clientAction] failed to parse ${file.name}:`, e)
      }
    }
    console.debug(
      "[clientAction] total tracks parsed:",
      allTracks.length,
      "worker ready:",
      !!mapStore.worker
    )
    if (allTracks.length > 0) {
      mapStore.tracks.push(...allTracks)
      mapStore.worker?.postMessage({ type: "PROCESS_TRACKS", tracks: allTracks, mode })
    }
    return {
      intent: "add-files" as const,
      count: files.length,
      trackCount: mapStore.tracks.length,
    }
  }

  if (intent === "clear-all") {
    mapStore.fogData = null
    mapStore.tracks = []
    mapStore.processedCount = 0
    mapStore.worker?.postMessage({ type: "RESET" })
    const map = mapStore.map
    if (map && mapStore.sourcesReady) {
      ;(map.getSource("fog-source") as maplibregl.GeoJSONSource)?.setData(
        worldFogGeoJSON()
      )
      ;(map.getSource("tracks-source") as maplibregl.GeoJSONSource)?.setData(
        featureCollection([])
      )
    }
    return { intent: "clear-all" as const, trackCount: 0 }
  }

  return null
}

export default function Home() {
  useLoaderData<typeof clientLoader>()
  const fetcher = useFetcher<typeof clientAction>()

  const [trackCount, setTrackCount] = useState(0)
  const [processedCount, setProcessedCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showTracks, setShowTracks] = useState(true)
  const [showFog, setShowFog] = useState(true)
  const [fogMode, setFogMode] = useState<FogMode>("corridor")
  const [mapMode, setMapMode] = useState<MapMode>("flat")
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntry | null>(null)

  // Show upload dialog once the map is ready and no tracks are loaded yet
  useEffect(() => {
    if (mapReady && trackCount === 0) {
      setShowUploadDialog(true)
    }
  }, [mapReady])

  // React to completed action (runs for both FileUploadDialog and ControlPanel submissions)
  useEffect(() => {
    const data = fetcher.data
    if (!data) return
    if (data.intent === "add-files") {
      setTrackCount(data.trackCount)
      setIsProcessing(true)
      setProcessedCount(0)
      setShowUploadDialog(false)
    }
    if (data.intent === "clear-all") {
      setTrackCount(0)
      setProcessedCount(0)
      setIsProcessing(false)
      setSelectedTrackId(null)
      setPhotos([])
      setSelectedPhoto(null)
    }
  }, [fetcher.data])

  function handleAddFiles(files: FileList, mode: FogMode = fogMode) {
    const formData = new FormData()
    formData.append("intent", "add-files")
    formData.append("mode", mode)
    for (const file of files) formData.append("files", file)
    fetcher.submit(formData, { method: "post", encType: "multipart/form-data" })
  }

  function handleClearAll() {
    photos.forEach((p) => { if (p.objectUrl) URL.revokeObjectURL(p.objectUrl) })
    const formData = new FormData()
    formData.append("intent", "clear-all")
    fetcher.submit(formData, { method: "post" })
  }

  async function handleAddPhotos(files: FileList) {
    const newEntries = await processPhotoFiles(Array.from(files), mapStore.tracks, photos)
    if (newEntries.length > 0) setPhotos((prev) => [...prev, ...newEntries])
  }

  function handleFogModeChange(newMode: FogMode) {
    setFogMode(newMode)
    if (mapStore.tracks.length === 0) return
    // Reset worker and re-process all stored tracks with the new mode
    mapStore.worker?.postMessage({ type: "RESET" })
    setIsProcessing(true)
    setProcessedCount(0)
    mapStore.worker?.postMessage({
      type: "PROCESS_TRACKS",
      tracks: mapStore.tracks,
      mode: newMode,
    })
  }

  function handleProcessingUpdate(count: number, done: boolean) {
    setProcessedCount(count)
    if (done) {
      setIsProcessing(false)
      setTrackCount(mapStore.tracks.length)
    }
  }

  const selectedTrack = selectedTrackId
    ? mapStore.tracks.find((t) => t.id === selectedTrackId) ?? null
    : null

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <ErrorBoundary>
        <MapView
          showTracks={showTracks}
          showFog={showFog}
          onMapReady={() => setMapReady(true)}
          onProcessingUpdate={handleProcessingUpdate}
          selectedTrackId={selectedTrackId}
          onTrackSelect={setSelectedTrackId}
          mapMode={mapMode}
          photos={photos}
          onPhotoSelect={setSelectedPhoto}
        />
      </ErrorBoundary>
      {mapReady && (
        <>
          <ControlPanel
            trackCount={trackCount}
            processedCount={processedCount}
            isProcessing={isProcessing}
            showTracks={showTracks}
            onShowTracksChange={setShowTracks}
            showFog={showFog}
            onShowFogChange={setShowFog}
            fogMode={fogMode}
            onFogModeChange={handleFogModeChange}
            mapMode={mapMode}
            onMapModeChange={setMapMode}
            onAddFiles={handleAddFiles}
            onClearAll={handleClearAll}
            photoCount={photos.length}
            onAddPhotos={handleAddPhotos}
          />
          <FileUploadDialog
            open={showUploadDialog}
            onOpenChange={setShowUploadDialog}
            onAddFiles={(files) => handleAddFiles(files, fogMode)}
          />
          <PhotoModal
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
          />
          {selectedTrack && (
            <ErrorBoundary
              fallback={(error, reset) => (
                <div className="absolute bottom-4 right-4 z-10 w-80">
                  <ErrorCard error={error} reset={reset} className="" />
                </div>
              )}
            >
              <TrackStatsPanel
                track={selectedTrack}
                onClose={() => setSelectedTrackId(null)}
              />
            </ErrorBoundary>
          )}
        </>
      )}
    </div>
  )
}
