import { useEffect, useState } from "react"
import { XIcon, ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { useDraggable } from "~/lib/useDraggable"
import type { PhotoGroup } from "~/types/photos"

interface PhotoCardProps {
  group: PhotoGroup | null
  onClose: () => void
}

export function PhotoCard({ group, onClose }: PhotoCardProps) {
  const [idx, setIdx] = useState(0)
  const { style, onMouseDown } = useDraggable({
    x: typeof window !== "undefined" ? window.innerWidth - 336 : 0,
    y: 16,
  })

  useEffect(() => {
    setIdx(0)
  }, [group?.id])

  if (!group) return null

  const photo = group.photos[idx]
  const count = group.photos.length

  return (
    <div className="absolute z-20 w-80" style={style}>
      <Card className="bg-background/80 backdrop-blur-md overflow-hidden">
        <CardHeader
          onMouseDown={onMouseDown}
          className="cursor-grab active:cursor-grabbing select-none"
        >
          <CardTitle className="text-xs truncate">
            {new Date(photo.takenAtMs).toLocaleString()}
          </CardTitle>
          <CardAction>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              aria-label="Close"
            >
              <XIcon weight="bold" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {photo.objectUrl && (
            <img
              src={photo.objectUrl}
              alt="Photo"
              className="w-full h-auto block"
            />
          )}
          {count > 1 && (
            <div className="flex items-center justify-between px-2 py-1.5">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIdx((i) => i - 1)}
                disabled={idx === 0}
                className={idx === 0 ? "invisible" : ""}
                aria-label="Previous photo"
              >
                <ArrowLeftIcon weight="bold" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {idx + 1} / {count}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIdx((i) => i + 1)}
                disabled={idx === count - 1}
                className={idx === count - 1 ? "invisible" : ""}
                aria-label="Next photo"
              >
                <ArrowRightIcon weight="bold" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
