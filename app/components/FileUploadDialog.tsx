import { useRef } from "react"
import { UploadSimple } from "@phosphor-icons/react"
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
}

export function FileUploadDialog({ open, onOpenChange, onAddFiles }: FileUploadDialogProps) {
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
        <div className="flex gap-3 pt-2">
          <Button
            className="flex-1"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadSimple weight="bold" className="mr-2" />
            Select files
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
