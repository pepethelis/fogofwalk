import { useRef } from "react"
import { Link } from "react-router"
import {
  Plus,
  Trash,
  MapTrifold,
  Path,
  Mountains,
  Globe,
  Cloud,
  Image,
  Question,
  ChartBar,
} from "@phosphor-icons/react"
import { Button, buttonVariants } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Switch } from "~/components/ui/switch"
import type { FogMode, MapMode } from "~/types/tracks"
import { Card, CardContent } from "./ui/card"

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

  return (
    <>
      <Card className="absolute top-6 left-6 z-10 bg-background/80 backdrop-blur-md">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <MapTrifold
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
            <Path
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
            <Cloud
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
              <Image
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
                <Globe size={13} />
              </Button>
              <Button
                size="icon"
                variant={mapMode === "relief" ? "default" : "ghost"}
                className="h-6 w-6"
                onClick={() => onMapModeChange("relief")}
                title="Satellite"
              >
                <Mountains size={13} />
              </Button>
            </div>
            <span className="text-xs text-muted-foreground select-none">
              Map style
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="absolute bottom-6 left-6 z-10 bg-background/80 backdrop-blur-md">
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
            <Plus weight="bold" className="mr-1.5" />
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
                <Image weight="bold" className="mr-1.5" />
                Add photos
              </Button>
            </>
          )}

          {trackCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              disabled={isProcessing || trackCount === 0}
            >
              <Trash weight="bold" className="mr-1.5" />
              Clear all
            </Button>
          )}

          <Link
            to="/stats"
            title="Statistics"
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          >
            <ChartBar weight="bold" size={16} />
          </Link>

          <Link
            to="/help"
            title="Help"
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
          >
            <Question weight="bold" size={16} />
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
    </>
  )
}
