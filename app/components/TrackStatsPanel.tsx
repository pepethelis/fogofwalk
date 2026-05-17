import { X } from "@phosphor-icons/react"
import type { ParsedTrack } from "~/types/tracks"
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { ElevationChart } from "~/components/ElevationChart"

interface TrackStatsPanelProps {
  track: ParsedTrack
  onClose: () => void
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatPace(minPerKm: number): string {
  const m = Math.floor(minPerKm)
  const s = Math.round((minPerKm - m) * 60)
  return `${m}:${String(s).padStart(2, "0")} /km`
}

function formatSpeed(kmh: number): string {
  return `${kmh.toFixed(1)} km/h`
}

function formatDistance(km: number): string {
  return `${km.toFixed(2)} km`
}

function formatElevation(m: number): string {
  return `${Math.round(m)} m`
}

interface StatRowProps {
  label: string
  value: string
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right tabular-nums">{value}</span>
    </>
  )
}

const EMPTY_STATS = {
  distanceKm: 0,
  elevationGainM: 0,
  elevationLossM: 0,
  hasElevation: false,
  durationMs: null,
  movingTimeMs: null,
  avgPaceMinPerKm: null,
  avgSpeedKmh: null,
  elevationProfile: [],
} as const

export function TrackStatsPanel({ track, onClose }: TrackStatsPanelProps) {
  // stats may be absent on tracks loaded before this field was added (HMR / future compat)
  const stats = track.stats ?? EMPTY_STATS

  return (
    <div className="absolute top-4 right-4 z-10 w-80">
      <Card className="bg-background/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="truncate">{track.name}</CardTitle>
          <CardAction>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              aria-label="Close"
            >
              <X weight="bold" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <StatRow
              label="Distance"
              value={formatDistance(stats.distanceKm)}
            />
            {stats.durationMs != null && (
              <StatRow
                label="Duration"
                value={formatDuration(stats.durationMs)}
              />
            )}
            {stats.movingTimeMs != null && (
              <StatRow
                label="Moving time"
                value={formatDuration(stats.movingTimeMs)}
              />
            )}
            {stats.avgPaceMinPerKm != null && (
              <StatRow
                label="Avg pace"
                value={formatPace(stats.avgPaceMinPerKm)}
              />
            )}
            {stats.avgMoovingPaceMinPerKm != null && (
              <StatRow
                label="Avg mooving pace"
                value={formatPace(stats.avgMoovingPaceMinPerKm)}
              />
            )}
            {stats.avgSpeedKmh != null && (
              <StatRow
                label="Avg speed"
                value={formatSpeed(stats.avgSpeedKmh)}
              />
            )}
            {stats.avgMoovingSpeedKmh != null && (
              <StatRow
                label="Avg mooving speed"
                value={formatSpeed(stats.avgMoovingSpeedKmh)}
              />
            )}
            {stats.hasElevation && (
              <>
                <StatRow
                  label="Elevation ↑"
                  value={formatElevation(stats.elevationGainM)}
                />
                <StatRow
                  label="Elevation ↓"
                  value={formatElevation(stats.elevationLossM)}
                />
              </>
            )}
          </div>
          {stats.hasElevation && stats.elevationProfile.length >= 2 && (
            <ElevationChart profile={stats.elevationProfile} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
