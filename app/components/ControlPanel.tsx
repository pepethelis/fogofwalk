import { useRef } from "react"
import { Plus, Trash, MapTrifold } from "@phosphor-icons/react"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Switch } from "~/components/ui/switch"

interface ControlPanelProps {
  trackCount: number
  processedCount: number
  isProcessing: boolean
  showTracks: boolean
  onShowTracksChange: (value: boolean) => void
  onAddFiles: (files: FileList) => void
  onClearAll: () => void
}

export function ControlPanel({
  trackCount,
  processedCount,
  isProcessing,
  showTracks,
  onShowTracksChange,
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
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-background/90 backdrop-blur-md border border-border rounded-2xl px-5 py-4 flex items-center gap-4 shadow-lg">
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
        <MapTrifold weight="duotone" className="text-muted-foreground" size={16} />
        <Switch
          id="show-tracks"
          checked={showTracks}
          onCheckedChange={onShowTracksChange}
        />
        <label htmlFor="show-tracks" className="text-sm text-muted-foreground cursor-pointer select-none">
          Tracks
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
    </div>
  )
}
