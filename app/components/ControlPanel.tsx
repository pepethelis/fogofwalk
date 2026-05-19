import { useRef } from "react"
import { Plus, Trash, MapTrifold, Path, Mountains } from "@phosphor-icons/react"
import { Button } from "~/components/ui/button"
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
  fogMode: FogMode
  onFogModeChange: (mode: FogMode) => void
  mapMode: MapMode
  onMapModeChange: (mode: MapMode) => void
  onAddFiles: (files: FileList) => void
  onClearAll: () => void
}

export function ControlPanel({
  trackCount,
  processedCount,
  isProcessing,
  showTracks,
  onShowTracksChange,
  fogMode,
  onFogModeChange,
  mapMode,
  onMapModeChange,
  onAddFiles,
  onClearAll,
}: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    onAddFiles(files)
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
            <Path weight="duotone" className="text-muted-foreground" size={16} />
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
            <Mountains weight="duotone" className="text-muted-foreground" size={16} />
            <Switch
              id="map-mode"
              checked={mapMode === "relief"}
              onCheckedChange={(checked) => onMapModeChange(checked ? "relief" : "flat")}
            />
            <label
              htmlFor="map-mode"
              className="cursor-pointer text-sm text-nowrap text-muted-foreground select-none"
            >
              Satellite
            </label>
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

          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            disabled={isProcessing || trackCount === 0}
          >
            <Trash weight="bold" className="mr-1.5" />
            Clear all
          </Button>

          {isProcessing ? (
            <Badge variant="secondary" className="tabular-nums">
              {processedCount} / {trackCount}
            </Badge>
          ) : trackCount > 0 ? (
            <Badge variant="secondary" className="tabular-nums">
              {trackCount} track{trackCount !== 1 ? "s" : ""}
            </Badge>
          ) : null}
        </CardContent>
      </Card>
    </>
  )
}
