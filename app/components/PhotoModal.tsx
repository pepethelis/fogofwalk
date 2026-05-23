import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import type { PhotoEntry } from "~/types/photos"

interface PhotoModalProps {
  photo: PhotoEntry | null
  onClose: () => void
}

export function PhotoModal({ photo, onClose }: PhotoModalProps) {
  return (
    <Dialog open={photo != null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden" showCloseButton>
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>
            {photo ? new Date(photo.takenAtMs).toLocaleString() : ""}
          </DialogTitle>
        </DialogHeader>
        {photo?.objectUrl && (
          <img
            src={photo.objectUrl}
            alt="Photo"
            className="w-full max-h-[80vh] object-contain bg-black"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
