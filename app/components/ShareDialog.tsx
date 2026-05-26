import { useState, useEffect, useRef, useMemo } from "react"
import { CaretLeft, CaretRight, DownloadSimple } from "@phosphor-icons/react"
import type { ParsedTrack } from "~/types/tracks"
import type { PhotoEntry } from "~/types/photos"
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
  STAT_DEFS,
  CARD_WIDTH,
  CARD_HEIGHT,
  drawShareCard,
  exportShareCard,
  getAvailableStats,
  getDefaultStats,
  filterPhotosForTrack,
} from "~/lib/shareCard"

// ─── Preview dimensions (1/4 scale of 1080×1440) ─────────────────────────────
const PREVIEW_W = 270
const PREVIEW_H = 360

const MAX_SELECTED = 4

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

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [enabledStats, setEnabledStats] = useState<StatKey[]>(() =>
    getDefaultStats(track)
  )
  const [isExporting, setIsExporting] = useState(false)

  const previewRef = useRef<HTMLCanvasElement>(null)

  // Re-render preview whenever state changes
  useEffect(() => {
    const canvas = previewRef.current
    if (!canvas) return
    // Set internal resolution (CSS size is controlled via style)
    canvas.width = CARD_WIDTH
    canvas.height = CARD_HEIGHT
    const photo = trackPhotos[selectedPhotoIndex] ?? null
    drawShareCard(canvas, { track, photo, enabledStats })
  }, [selectedPhotoIndex, enabledStats, track, trackPhotos])

  function toggleStat(key: StatKey) {
    setEnabledStats((prev) => {
      if (prev.includes(key)) {
        // Deselect — keep at least 1 stat
        if (prev.length <= 1) return prev
        return prev.filter((k) => k !== key)
      }
      // Select — FIFO swap when already at max
      if (prev.length < MAX_SELECTED) return [...prev, key]
      return [...prev.slice(1), key]
    })
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      const photo = trackPhotos[selectedPhotoIndex] ?? null
      await exportShareCard({ track, photo, enabledStats })
    } finally {
      setIsExporting(false)
    }
  }

  const hasPrev = selectedPhotoIndex > 0
  const hasNext = selectedPhotoIndex < trackPhotos.length - 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              // Slightly round the preview card corners
              borderRadius: 4,
              // Prevent blurry upscaling if CSS size > canvas px
              imageRendering: "auto",
            }}
          />
        </div>

        {/* ── Photo background navigation ───────────────────────────────── */}
        {trackPhotos.length > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Photo background
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setSelectedPhotoIndex((i) => i - 1)}
                disabled={!hasPrev}
                aria-label="Previous photo"
              >
                <CaretLeft />
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
                <CaretRight />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No photos linked to this track — showing route on dark background.
          </p>
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
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleExport} disabled={isExporting}>
            <DownloadSimple weight="duotone" />
            {isExporting ? "Exporting…" : "Download PNG"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
