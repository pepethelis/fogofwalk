import { useRef } from "react"
import { Plus, Trash, MapTrifold, Path } from "@phosphor-icons/react"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Switch } from "~/components/ui/switch"
import type { FogMode } from "~/types/tracks"
import { Card, CardContent } from "./ui/card"

interface ControlPanelProps {
  trackCount: number
  processedCount: number
  isProcessing: boolean
  showTracks: boolean
  onShowTracksChange: (value: boolean) => void
  fogMode: FogMode
  onFogModeChange: (mode: FogMode) => void
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
    <Card className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 bg-background/80 backdrop-blur-md">
      <CardContent className="flex items-center gap-4">
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

        <div className="h-5 w-px bg-border" />

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

        <div className="h-5 w-px bg-border" />

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

        <div className="h-5 w-px bg-border" />

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
  )
}
