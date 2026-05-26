import { useRef } from "react"
import { Link } from "react-router"
import { FlaskIcon, UploadIcon } from "@phosphor-icons/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"

interface FileUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddFiles: (files: FileList) => void
  onLoadSampleData: () => void
}

export function FileUploadDialog({
  open,
  onOpenChange,
  onAddFiles,
  onLoadSampleData,
}: FileUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    onAddFiles(files)
    e.target.value = ""
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Load activity files</DialogTitle>
          <DialogDescription>
            Select GPX or FIT files from your computer. The map fog will clear
            along your routes.
          </DialogDescription>
        </DialogHeader>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".gpx,.fit"
          className="hidden"
          onChange={handleFileChange}
        />
        <Link
          to="/help"
          className="text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
        >
          New to Fog of Walk? Learn how it works →
        </Link>
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex gap-3">
            <Button
              autoFocus
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon weight="bold" className="mr-2" />
              Select files
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                onLoadSampleData()
              }}
            >
              <FlaskIcon weight="bold" className="mr-2" />
              Try sample
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
