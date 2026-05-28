import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { CaretLeftIcon, CaretRightIcon, CopyIcon, DownloadSimpleIcon } from "@phosphor-icons/react"
import type { ParsedTrack } from "~/types/tracks"
import type { PhotoEntry } from "~/types/photos"
import { mapStore } from "~/lib/mapStore"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import {
  type StatKey,
  type BackgroundMode,
  STAT_DEFS,
  CARD_WIDTH,
  CARD_HEIGHT,
  drawShareCard,
  exportShareCard,
  copyShareCard,
  getAvailableStats,
  getDefaultStats,
  filterPhotosForTrack,
} from "~/lib/shareCard"
import { ShareMapView } from "~/components/ShareMapView"

// ─── Preview dimensions (1/4 scale of 1080×1440) ─────────────────────────────
const PREVIEW_W = 270
const PREVIEW_H = 360

const MAX_SELECTED = 4
const BLUR_PRESETS = [0, 2, 4, 6, 8, 12, 20]

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  track: ParsedTrack
  photos: PhotoEntry[]
}

export function ShareDialog({
  open,
  onOpenChange,
  track,
  photos,
}: ShareDialogProps) {
  const trackPhotos = useMemo(
    () => filterPhotosForTrack(photos, track),
    [photos, track]
  )
  const availableStats = useMemo(() => getAvailableStats(track), [track])

  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>(() =>
    trackPhotos.length > 0 ? "photo" : "dark"
  )
  const [blurAmount, setBlurAmount] = useState(6)
  const [mapBaseSnapshot, setMapBaseSnapshot] = useState<ImageBitmap | null>(null)
  const [mapTrackPoints, setMapTrackPoints] = useState<{ x: number; y: number }[] | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [enabledStats, setEnabledStats] = useState<StatKey[]>(() =>
    getDefaultStats(track)
  )
  const [isExporting, setIsExporting] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const previewRef = useRef<HTMLCanvasElement>(null)

  // When switching to map mode, serve from cache if available (avoids a new WebGL context)
  useEffect(() => {
    if (backgroundMode !== "map") {
      // Switching away: null out state but leave the cache intact so the next
      // open of the same track is instant. Only close the bitmap if it is NOT
      // the cached reference (i.e. it was created outside the cache path).
      setMapBaseSnapshot((prev) => {
        if (prev && mapStore.shareCardCache?.baseMap !== prev) prev.close()
        return null
      })
      setMapTrackPoints(null)
      setIsMapReady(false)
      return
    }
    // Switching to map mode: check the cache first
    const cached = mapStore.shareCardCache
    if (cached?.trackId === track.id) {
      setMapBaseSnapshot(cached.baseMap)
      setMapTrackPoints(cached.trackPoints)
      setIsMapReady(true)
    }
  }, [backgroundMode, track.id])

  // Called by ShareMapView once base map + projected track points are ready
  const handleMapReady = useCallback(
    (baseMap: ImageBitmap, trackPoints: { x: number; y: number }[]) => {
      // Update cache (close previous entry if it's for a different track)
      if (mapStore.shareCardCache && mapStore.shareCardCache.trackId !== track.id) {
        mapStore.shareCardCache.baseMap.close()
      }
      mapStore.shareCardCache = { trackId: track.id, baseMap, trackPoints }
      setMapBaseSnapshot(baseMap)
      setMapTrackPoints(trackPoints)
      setIsMapReady(true)
    },
    [track.id]
  )

  // Re-render preview whenever relevant state changes.
  // `open` is in deps so this fires when the Base UI portal first commits the canvas to DOM.
  // requestAnimationFrame defers past the portal's own paint so previewRef is guaranteed set.
  // The callback is async so drawShareCard's internal awaits (fonts.ready, createImageBitmap)
  // run in the correct order — without await the first photo-mode paint would flash blank.
  useEffect(() => {
    if (!open) return
    const raf = requestAnimationFrame(async () => {
      const canvas = previewRef.current
      if (!canvas) return
      // Canvas internal resolution = full card (1080×1440); CSS size = 270×360 (¼ scale).
      // The browser scales down automatically — intentional, not a bug.
      canvas.width = CARD_WIDTH
      canvas.height = CARD_HEIGHT
      const photo = trackPhotos[selectedPhotoIndex] ?? null
      await drawShareCard(canvas, {
        track,
        photo,
        mapBaseSnapshot,
        mapTrackPoints,
        backgroundMode,
        blurAmount,
        enabledStats,
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [
    open,
    selectedPhotoIndex,
    enabledStats,
    track,
    trackPhotos,
    backgroundMode,
    blurAmount,
    mapBaseSnapshot,
    mapTrackPoints,
  ])

  function toggleStat(key: StatKey) {
    setEnabledStats((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev
        return prev.filter((k) => k !== key)
      }
      if (prev.length < MAX_SELECTED) return [...prev, key]
      return [...prev.slice(1), key]
    })
  }

  async function handleCopy() {
    setIsCopying(true)
    setActionError(null)
    try {
      const photo = trackPhotos[selectedPhotoIndex] ?? null
      await copyShareCard({
        track,
        photo,
        mapBaseSnapshot,
        mapTrackPoints,
        backgroundMode,
        blurAmount,
        enabledStats,
      })
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      // Clipboard API unavailable (non-HTTPS, Firefox without permission, etc.)
      const msg = err instanceof Error ? err.message : "Copy failed"
      setActionError(msg)
      setTimeout(() => setActionError(null), 4000)
    } finally {
      setIsCopying(false)
    }
  }

  async function handleExport() {
    setIsExporting(true)
    setActionError(null)
    try {
      const photo = trackPhotos[selectedPhotoIndex] ?? null
      await exportShareCard({
        track,
        photo,
        mapBaseSnapshot,
        mapTrackPoints,
        backgroundMode,
        blurAmount,
        enabledStats,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed"
      setActionError(msg)
      setTimeout(() => setActionError(null), 4000)
    } finally {
      setIsExporting(false)
    }
  }

  const hasPrev = selectedPhotoIndex > 0
  const hasNext = selectedPhotoIndex < trackPhotos.length - 1

  const bgModes: { key: BackgroundMode; label: string }[] = [
    { key: "photo", label: "Photo" },
    { key: "dark", label: "Dark" },
    { key: "map", label: "Map" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Off-screen map renderer — mounted only when map mode is active and no cached data.
          Once isMapReady is true the result is stored in mapStore.shareCardCache and this
          component unmounts, releasing the WebGL context. */}
      {backgroundMode === "map" && !isMapReady && (
        <ShareMapView track={track} onReady={handleMapReady} />
      )}

      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Share activity</DialogTitle>
        </DialogHeader>

        {/* ── Live preview ─────────────────────────────────────────────── */}
        <div className="flex justify-center py-1">
          <canvas
            ref={previewRef}
            style={{
              width: PREVIEW_W,
              height: PREVIEW_H,
              display: "block",
              borderRadius: 4,
              imageRendering: "auto",
            }}
          />
          {backgroundMode === "map" && !isMapReady && (
            <span
              className="pointer-events-none absolute text-xs text-muted-foreground"
              style={{ marginTop: PREVIEW_H / 2 - 8 }}
            >
              Rendering map…
            </span>
          )}
        </div>

        {/* ── Background mode selector ──────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Background</span>
          <div className="flex gap-1.5">
            {bgModes.map(({ key, label }) => {
              if (key === "photo" && trackPhotos.length === 0) return null
              return (
                <Button
                  key={key}
                  size="xs"
                  variant={backgroundMode === key ? "default" : "outline"}
                  onClick={() => setBackgroundMode(key)}
                >
                  {label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* ── Photo navigation (only in photo mode, multiple photos) ────── */}
        {backgroundMode === "photo" && trackPhotos.length > 1 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">Photo</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setSelectedPhotoIndex((i) => i - 1)}
                disabled={!hasPrev}
                aria-label="Previous photo"
              >
                <CaretLeftIcon />
              </Button>
              <span className="min-w-[3rem] text-center text-xs tabular-nums">
                {selectedPhotoIndex + 1} / {trackPhotos.length}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setSelectedPhotoIndex((i) => i + 1)}
                disabled={!hasNext}
                aria-label="Next photo"
              >
                <CaretRightIcon />
              </Button>
            </div>
          </div>
        )}

        {/* ── Blur buttons (hidden in dark mode) ───────────────────────── */}
        {backgroundMode !== "dark" && (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">Blur</span>
            <div className="flex flex-wrap gap-1.5">
              {BLUR_PRESETS.map((v) => (
                <Button
                  key={v}
                  size="xs"
                  variant={blurAmount === v ? "default" : "outline"}
                  onClick={() => setBlurAmount(v)}
                >
                  {v}px
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* ── Stats toggles ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">
            Stats{" "}
            <span className="opacity-50">
              ({enabledStats.length} / {MAX_SELECTED})
            </span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {availableStats.map((key) => {
              const selected = enabledStats.includes(key)
              return (
                <Button
                  key={key}
                  size="xs"
                  variant={selected ? "default" : "outline"}
                  onClick={() => toggleStat(key)}
                  aria-pressed={selected}
                >
                  {STAT_DEFS[key].label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        {actionError && (
          <p className="text-xs text-destructive">{actionError}</p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isExporting || isCopying}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={isCopying || isExporting}
          >
            <CopyIcon weight="bold" />
            {isCopied ? "Copied!" : isCopying ? "Copying…" : "Copy PNG"}
          </Button>
          <Button size="sm" onClick={handleExport} disabled={isExporting || isCopying}>
            <DownloadSimpleIcon weight="bold" />
            {isExporting ? "Exporting…" : "Download PNG"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
