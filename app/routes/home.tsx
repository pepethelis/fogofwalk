import { useState, useEffect } from "react"
import { useFetcher, useLoaderData } from "react-router"
import type maplibregl from "maplibre-gl"
import { featureCollection } from "@turf/helpers"
import type { Route } from "./+types/home"
import { MapView } from "~/components/MapView"
import { ControlPanel } from "~/components/ControlPanel"
import { FileUploadDialog } from "~/components/FileUploadDialog"
import { mapStore, buildFogGeoJSON } from "~/lib/mapStore"
import { parseFile } from "~/lib/parsers"
import type { ParsedTrack } from "~/types/tracks"

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
    console.debug("[clientAction] add-files", {
      fileCount: files.length,
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
      console.log("[clientAction] allTracks", allTracks)
      mapStore.worker?.postMessage({
        type: "PROCESS_TRACKS",
        tracks: allTracks,
      })
    }
    return {
      intent: "add-files" as const,
      count: files.length,
      trackCount: mapStore.tracks.length,
    }
  }

  if (intent === "clear-all") {
    mapStore.fogHoles = []
    mapStore.tracks = []
    mapStore.processedCount = 0
    mapStore.worker?.postMessage({ type: "RESET" })
    const map = mapStore.map
    if (map && mapStore.sourcesReady) {
      ;(map.getSource("fog-source") as maplibregl.GeoJSONSource)?.setData(
        buildFogGeoJSON([])
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
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [mapReady, setMapReady] = useState(false)

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
    }
  }, [fetcher.data])

  function handleAddFiles(files: FileList) {
    const formData = new FormData()
    formData.append("intent", "add-files")
    for (const file of files) formData.append("files", file)
    fetcher.submit(formData, { method: "post", encType: "multipart/form-data" })
  }

  function handleClearAll() {
    const formData = new FormData()
    formData.append("intent", "clear-all")
    fetcher.submit(formData, { method: "post" })
  }

  function handleProcessingUpdate(count: number, done: boolean) {
    setProcessedCount(count)
    if (done) {
      setIsProcessing(false)
      setTrackCount(mapStore.tracks.length)
    }
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapView
        showTracks={showTracks}
        onMapReady={() => setMapReady(true)}
        onProcessingUpdate={handleProcessingUpdate}
      />
      {mapReady && (
        <>
          <ControlPanel
            trackCount={trackCount}
            processedCount={processedCount}
            isProcessing={isProcessing}
            showTracks={showTracks}
            onShowTracksChange={setShowTracks}
            onAddFiles={handleAddFiles}
            onClearAll={handleClearAll}
          />
          <FileUploadDialog
            open={showUploadDialog}
            onOpenChange={setShowUploadDialog}
            onAddFiles={handleAddFiles}
          />
        </>
      )}
    </div>
  )
}
