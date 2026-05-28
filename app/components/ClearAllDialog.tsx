import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog"

interface ClearAllDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trackCount: number
  photoCount: number
  onConfirm: () => void
}

export function ClearAllDialog({
  open,
  onOpenChange,
  trackCount,
  photoCount,
  onConfirm,
}: ClearAllDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Clear all data?</DialogTitle>
          <DialogDescription>
            All {trackCount} track{trackCount !== 1 ? "s" : ""}
            {photoCount > 0
              ? ` and ${photoCount} photo${photoCount !== 1 ? "s" : ""}`
              : ""}{" "}
            will be removed and the fog map will be reset. This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onOpenChange(false)
              onConfirm()
            }}
          >
            Clear all
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
