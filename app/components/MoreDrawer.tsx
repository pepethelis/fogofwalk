import { useState } from "react"
import { Link } from "react-router"
import {
  ImageIcon,
  TrashIcon,
  ChartBarIcon,
  QuestionIcon,
  CaretRightIcon,
} from "@phosphor-icons/react"
import { Drawer, DrawerContent } from "~/components/ui/drawer"
import { Item, ItemContent, ItemMedia, ItemTitle } from "~/components/ui/item"
import { ClearAllDialog } from "~/components/ClearAllDialog"

interface MoreDrawerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  trackCount: number
  photoCount: number
  isProcessing: boolean
  processedCount: number
  showAddPhotosOption: boolean
  onAddPhotos: () => void
  onClearAll: () => void
}

export function MoreDrawer({
  isOpen,
  onOpenChange,
  trackCount,
  photoCount,
  isProcessing,
  processedCount,
  showAddPhotosOption,
  onAddPhotos,
  onClearAll,
}: MoreDrawerProps) {
  const close = () => onOpenChange(false)
  const [isClearAllOpen, setIsClearAllOpen] = useState(false)

  return (
    <>
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex flex-col gap-3 px-4 pt-2 pb-8">
          {/* Actions group */}
          {(showAddPhotosOption || trackCount > 0) && (
            <div className="overflow-hidden ring-1 ring-foreground/10">
              {showAddPhotosOption && (
                <Item
                  variant="muted"
                  render={<button type="button" />}
                  onClick={() => {
                    close()
                    setTimeout(onAddPhotos, 250)
                  }}
                  className="active:brightness-95"
                >
                  <ItemMedia variant="icon">
                    <ImageIcon
                      weight="duotone"
                      className="size-5 text-muted-foreground"
                    />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>Add photos</ItemTitle>
                  </ItemContent>
                  <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
                </Item>
              )}
              {showAddPhotosOption && trackCount > 0 && (
                <div className="ml-10 border-t border-foreground/10" />
              )}
              {trackCount > 0 && (
                <Item
                  variant="muted"
                  render={<button type="button" disabled={isProcessing} />}
                  onClick={() => {
                    close()
                    setTimeout(() => setIsClearAllOpen(true), 300)
                  }}
                  className="text-destructive active:brightness-95 disabled:opacity-40"
                >
                  <ItemMedia variant="icon">
                    <TrashIcon weight="duotone" className="size-5" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>Clear all</ItemTitle>
                  </ItemContent>
                  <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
                </Item>
              )}
            </div>
          )}

          {/* Navigation group */}
          <div className="overflow-hidden ring-1 ring-foreground/10">
            <Item variant="muted" render={<Link to="/stats" />} onClick={close}>
              <ItemMedia variant="icon">
                <ChartBarIcon
                  weight="duotone"
                  className="size-5 text-muted-foreground"
                />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Statistics</ItemTitle>
              </ItemContent>
              <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </Item>
            <div className="ml-10 border-t border-foreground/10" />
            <Item variant="muted" render={<Link to="/help" />} onClick={close}>
              <ItemMedia variant="icon">
                <QuestionIcon
                  weight="duotone"
                  className="size-5 text-muted-foreground"
                />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Help</ItemTitle>
              </ItemContent>
              <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </Item>
          </div>

          {/* Status */}
          {(isProcessing || trackCount > 0 || photoCount > 0) && (
            <p className="py-1 text-center text-xs text-muted-foreground">
              {isProcessing
                ? `Processing ${processedCount} of ${trackCount}…`
                : [
                    trackCount > 0 &&
                      `${trackCount} track${trackCount !== 1 ? "s" : ""}`,
                    photoCount > 0 &&
                      `${photoCount} photo${photoCount !== 1 ? "s" : ""}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>

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
