import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "~/lib/utils"

function BottomSheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="bottom-sheet" {...props} />
}

interface BottomSheetContentProps extends DialogPrimitive.Popup.Props {
  onClose: () => void
}

function BottomSheetContent({
  className,
  children,
  onClose,
  ...props
}: BottomSheetContentProps) {
  const handleRef = React.useRef<HTMLDivElement>(null)
  const startY = React.useRef<number | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startY.current === null) return
    const delta = e.changedTouches[0].clientY - startY.current
    startY.current = null
    if (delta > 60) {
      onClose()
    }
  }

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="bottom-sheet-overlay"
        className="fixed inset-0 isolate z-50 bg-black/40 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      />
      <DialogPrimitive.Popup
        data-slot="bottom-sheet-content"
        className={cn(
          "fixed right-0 bottom-0 left-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-xl bg-popover text-xs/relaxed text-popover-foreground ring-1 ring-foreground/10 outline-none data-open:animate-in data-open:duration-300 data-open:ease-out data-open:slide-in-from-bottom data-closed:animate-out data-closed:duration-75 data-closed:ease-in data-closed:slide-out-to-bottom",
          className
        )}
        {...props}
      >
        {/* Drag handle */}
        <div
          ref={handleRef}
          className="flex cursor-grab touch-none justify-center pt-2 pb-1 active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

function BottomSheetHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bottom-sheet-header"
      className={cn("flex flex-col gap-1 px-4 pt-1 pb-2", className)}
      {...props}
    />
  )
}

function BottomSheetTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bottom-sheet-title"
      className={cn("font-heading text-sm font-medium", className)}
      {...props}
    />
  )
}

export { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle }
