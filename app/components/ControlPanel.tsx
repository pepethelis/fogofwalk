import { useRef, useState } from "react"
import { Link } from "react-router"
import {
  PlusIcon,
  TrashIcon,
  MapTrifoldIcon,
  PathIcon,
  MountainsIcon,
  GlobeIcon,
  CloudIcon,
  ImageIcon,
  QuestionIcon,
  ChartBarIcon,
  SlidersIcon,
  CaretUpIcon,
  DotsThreeIcon,
} from "@phosphor-icons/react"
import { Button, buttonVariants } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Switch } from "~/components/ui/switch"
import type { FogMode, MapMode } from "~/types/tracks"
import { Card, CardContent } from "./ui/card"
import { MoreDrawer } from "~/components/MoreDrawer"
import { useIsMobile } from "~/lib/useIsMobile"
import { ClearAllDialog } from "~/components/ClearAllDialog"

interface ControlPanelProps {
  trackCount: number
  processedCount: number
  isProcessing: boolean
  showTracks: boolean
  onShowTracksChange: (value: boolean) => void
  showFog: boolean
  onShowFogChange: (value: boolean) => void
  fogMode: FogMode
  onFogModeChange: (mode: FogMode) => void
  mapMode: MapMode
  onMapModeChange: (mode: MapMode) => void
  onAddFiles: (files: FileList) => void
  onClearAll: () => void
  photoCount: number
  onAddPhotos: (files: FileList) => void
  showPhotos: boolean
  onShowPhotosChange: (value: boolean) => void
}

export function ControlPanel({
  trackCount,
  processedCount,
  isProcessing,
  showTracks,
  onShowTracksChange,
  showFog,
  onShowFogChange,
  fogMode,
  onFogModeChange,
  mapMode,
  onMapModeChange,
  onAddFiles,
  onClearAll,
  photoCount,
  onAddPhotos,
  showPhotos,
  onShowPhotosChange,
}: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isClearAllOpen, setIsClearAllOpen] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    onAddFiles(files)
    e.target.value = ""
  }

  function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    onAddPhotos(files)
    e.target.value = ""
  }

  const togglesList = (
    <>
      <div className="flex items-center gap-2">
        <MapTrifoldIcon
          weight="duotone"
          className="text-muted-foreground"
          size={16}
        />
        <Switch
          id="show-tracks"
          checked={showTracks}
          onCheckedChange={onShowTracksChange}
        />
        <label
          htmlFor="show-tracks"
          className="cursor-pointer text-sm text-muted-foreground select-none"
        >
          Tracks
        </label>
      </div>

      <div className="flex items-center gap-2">
        <PathIcon
          weight="duotone"
          className="text-muted-foreground"
          size={16}
        />
        <Switch
          id="fog-mode"
          checked={fogMode === "fill"}
          onCheckedChange={(checked) =>
            onFogModeChange(checked ? "fill" : "corridor")
          }
        />
        <label
          htmlFor="fog-mode"
          className="cursor-pointer text-sm text-nowrap text-muted-foreground select-none"
        >
          Fill loops
        </label>
      </div>

      <div className="flex items-center gap-2">
        <CloudIcon
          weight="duotone"
          className="text-muted-foreground"
          size={16}
        />
        <Switch
          id="show-fog"
          checked={showFog}
          onCheckedChange={onShowFogChange}
        />
        <label
          htmlFor="show-fog"
          className="cursor-pointer text-sm text-muted-foreground select-none"
        >
          Fog
        </label>
      </div>

      {photoCount > 0 && (
        <div className="flex items-center gap-2">
          <ImageIcon
            weight="duotone"
            className="text-muted-foreground"
            size={16}
          />
          <Switch
            id="show-photos"
            checked={showPhotos}
            onCheckedChange={onShowPhotosChange}
          />
          <label
            htmlFor="show-photos"
            className="cursor-pointer text-sm text-muted-foreground select-none"
          >
            Photos
          </label>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <Button
            size="icon"
            variant={mapMode === "flat" ? "default" : "ghost"}
            className="h-6 w-6"
            onClick={() => onMapModeChange("flat")}
            title="Standard"
          >
            <GlobeIcon size={13} />
          </Button>
          <Button
            size="icon"
            variant={mapMode === "relief" ? "default" : "ghost"}
            className="h-6 w-6"
            onClick={() => onMapModeChange("relief")}
            title="Satellite"
          >
            <MountainsIcon size={13} />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground select-none">
          Map style
        </span>
      </div>
    </>
  )

  // Whether to show the Add Photos option in the more sheet
  const showAddPhotosOption = trackCount > 0 && (showPhotos || photoCount === 0)

  return (
    <>
      {/* ── Settings / toggles ──────────────────────────────────────── */}
      {isMobile ? (
        <div className="absolute top-1.5 left-1.5 z-10 flex flex-col">
          {isSettingsOpen && (
            <Card className="bg-background/80 backdrop-blur-md">
              <CardContent className="flex flex-col gap-3">
                {togglesList}
              </CardContent>
            </Card>
          )}
          <Button
            variant="ghost"
            size="icon-lg"
            className="border-0 bg-background/80 backdrop-blur-md active:border-0 active:not-aria-[haspopup]:translate-y-0 aria-expanded:bg-background/80"
            onClick={() => setIsSettingsOpen((v) => !v)}
            aria-label="Toggle settings"
            aria-expanded={isSettingsOpen}
          >
            {isSettingsOpen ? (
              <CaretUpIcon size={16} />
            ) : (
              <SlidersIcon weight="duotone" size={16} />
            )}
          </Button>
        </div>
      ) : (
        <Card className="absolute top-3 left-3 z-10 bg-background/80 backdrop-blur-md">
          <CardContent className="flex flex-col gap-3">
            {togglesList}
          </CardContent>
        </Card>
      )}

      {/* ── Desktop bottom action bar ────────────────────────────────── */}
      {!isMobile && (
        <Card className="absolute right-0 bottom-5 z-10 bg-background/80 backdrop-blur-md">
          <CardContent className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".gpx,.fit"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="default"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <PlusIcon weight="bold" className="mr-1.5" />
              Add files
            </Button>

            {trackCount > 0 && (showPhotos || photoCount === 0) && (
              <>
                <input
                  ref={photoInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                  title="Add photos (JPEG/HEIC)"
                >
                  <ImageIcon weight="bold" className="mr-1.5" />
                  Add photos
                </Button>
              </>
            )}

            {trackCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsClearAllOpen(true)}
                disabled={isProcessing || trackCount === 0}
              >
                <TrashIcon weight="bold" className="mr-1.5" />
                Clear all
              </Button>
            )}

            <Link
              to="/stats"
              title="Statistics"
              className={buttonVariants({
                variant: "outline",
                size: "icon-sm",
              })}
            >
              <ChartBarIcon weight="bold" size={16} />
            </Link>

            <Link
              to="/help"
              title="Help"
              className={buttonVariants({
                variant: "outline",
                size: "icon-sm",
              })}
            >
              <QuestionIcon weight="bold" size={16} />
            </Link>

            {isProcessing ? (
              <Badge variant="secondary" className="tabular-nums">
                {processedCount} / {trackCount}
              </Badge>
            ) : trackCount > 0 ? (
              <Badge variant="secondary" className="tabular-nums">
                {trackCount} track{trackCount !== 1 ? "s" : ""}
              </Badge>
            ) : null}
            {photoCount > 0 && showPhotos && (
              <Badge variant="secondary" className="tabular-nums">
                {photoCount} photo{photoCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Mobile bottom bar ────────────────────────────────────────── */}
      {isMobile && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".gpx,.fit"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={photoInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handlePhotoFileChange}
          />

          <Card
            className="absolute right-5 bottom-10 z-10 bg-background/80 backdrop-blur-md"
            style={{
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            }}
          >
            <CardContent className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <PlusIcon weight="bold" size={15} />
                {isProcessing
                  ? `${processedCount} / ${trackCount}`
                  : "Add files"}
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setIsMoreOpen(true)}
                aria-label="More options"
              >
                <DotsThreeIcon weight="bold" size={18} />
              </Button>
            </CardContent>
          </Card>

          {/* "More" options sheet */}
          <MoreDrawer
            isOpen={isMoreOpen}
            onOpenChange={setIsMoreOpen}
            trackCount={trackCount}
            photoCount={photoCount}
            isProcessing={isProcessing}
            processedCount={processedCount}
            showAddPhotosOption={showAddPhotosOption}
            onAddPhotos={() => photoInputRef.current?.click()}
            onClearAll={() => setIsClearAllOpen(true)}
          />
        </>
      )}

      <ClearAllDialog
        open={isClearAllOpen}
        onOpenChange={setIsClearAllOpen}
        trackCount={trackCount}
        photoCount={photoCount}
        onConfirm={onClearAll}
      />
    </>
  )
}
