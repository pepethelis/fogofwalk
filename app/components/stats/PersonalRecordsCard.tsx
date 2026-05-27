import { Link } from "react-router"
import type { PersonalRecords } from "~/lib/statsAggregator"
import { formatElevation, formatPace, formatMovingTime } from "~/lib/statsFormatters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"

// ─── RecordRow ────────────────────────────────────────────────────────────────

interface RecordRowProps {
  label: string
  trackId: string
  trackName: string
  value: React.ReactNode
  divider?: boolean
}

function RecordRow({ label, trackId, trackName, value, divider = false }: RecordRowProps) {
  return (
    <div
      className={`flex items-start justify-between gap-3 ${
        divider ? "border-t border-border pt-3" : ""
      }`}
    >
      <div className="min-w-0">
        <CardDescription>{label}</CardDescription>
        <Link
          to={`/?track=${trackId}`}
          className="mt-0.5 block truncate text-xs text-foreground underline-offset-2 hover:underline"
          title={trackName}
        >
          {trackName}
        </Link>
      </div>
      <Badge variant="secondary" className="shrink-0 tabular-nums">
        {value}
      </Badge>
    </div>
  )
}

// ─── PersonalRecordsCard ──────────────────────────────────────────────────────

interface PersonalRecordsCardProps {
  records: PersonalRecords
}

export function PersonalRecordsCard({ records }: PersonalRecordsCardProps) {
  const isEmpty = !records.longestActivity

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal records</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isEmpty ? (
          <CardDescription>No data yet.</CardDescription>
        ) : (
          <>
            {records.longestActivity && (
              <RecordRow
                label="Longest activity"
                trackId={records.longestActivity.track.id}
                trackName={records.longestActivity.track.name}
                value={`${records.longestActivity.distanceKm.toFixed(1)} km`}
              />
            )}
            {records.mostElevation && (
              <RecordRow
                divider
                label="Most elevation gain"
                trackId={records.mostElevation.track.id}
                trackName={records.mostElevation.track.name}
                value={formatElevation(records.mostElevation.elevationGainM)}
              />
            )}
            {records.fastestPace && (
              <RecordRow
                divider
                label="Fastest moving pace"
                trackId={records.fastestPace.track.id}
                trackName={records.fastestPace.track.name}
                value={formatPace(records.fastestPace.paceMinPerKm)}
              />
            )}
            {records.fastestSpeed && (
              <RecordRow
                divider
                label="Fastest avg speed"
                trackId={records.fastestSpeed.track.id}
                trackName={records.fastestSpeed.track.name}
                value={`${records.fastestSpeed.speedKmh.toFixed(1)} km/h`}
              />
            )}
            {records.longestMovingTime && (
              <RecordRow
                divider
                label="Longest moving time"
                trackId={records.longestMovingTime.track.id}
                trackName={records.longestMovingTime.track.name}
                value={formatMovingTime(records.longestMovingTime.movingTimeMs)}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
