import { PlusIcon, MinusIcon, NavigationArrowIcon } from "@phosphor-icons/react"
import { Button } from "~/components/ui/button"
import { ButtonGroup } from "~/components/ui/button-group"
import { cn } from "~/lib/utils"
import { mapStore } from "~/lib/mapStore"

interface MapCompassProps {
  bearing: number
  onReset: () => void
  className?: string
}

export function MapCompass({ bearing, onReset, className }: MapCompassProps) {
  const isNorth = Math.abs(bearing) < 0.5

  return (
    <ButtonGroup
      orientation="vertical"
      className={cn("bg-background/80 backdrop-blur-md", className)}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => mapStore.map?.zoomIn()}
        title="Zoom in"
        aria-label="Zoom in"
        className="border-none bg-transparent"
      >
        <PlusIcon weight="bold" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => mapStore.map?.zoomOut()}
        title="Zoom out"
        aria-label="Zoom out"
        className="border-none bg-transparent"
      >
        <MinusIcon weight="bold" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onReset}
        title={isNorth ? "Facing north" : "Reset to north"}
        aria-label={isNorth ? "Facing north" : "Reset to north"}
        className="border-none bg-transparent"
      >
        <NavigationArrowIcon
          weight="fill"
          className="text-red-500"
          style={{
            transform: `rotate(${45 - bearing}deg)`,
            transition: "transform 0.08s linear",
          }}
        />
      </Button>
    </ButtonGroup>
  )
}
