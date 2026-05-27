import type { PersonalRecords } from "~/lib/statsAggregator"
import { formatElevation, formatPace, formatMovingTime } from "~/lib/statsFormatters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"

interface PersonalRecordsCardProps {
  prs: PersonalRecords
}

export function PersonalRecordsCard({ prs }: PersonalRecordsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal records</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {prs.longestActivity && (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardDescription>Longest activity</CardDescription>
              <p
                className="mt-0.5 truncate text-xs text-foreground"
                title={prs.longestActivity.track.name}
              >
                {prs.longestActivity.track.name}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              {prs.longestActivity.distanceKm.toFixed(1)} km
            </Badge>
          </div>
        )}

        {prs.mostElevation && (
          <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
            <div className="min-w-0">
              <CardDescription>Most elevation gain</CardDescription>
              <p
                className="mt-0.5 truncate text-xs text-foreground"
                title={prs.mostElevation.track.name}
              >
                {prs.mostElevation.track.name}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              {formatElevation(prs.mostElevation.elevationGainM)}
            </Badge>
          </div>
        )}

        {prs.fastestPace && (
          <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
            <div className="min-w-0">
              <CardDescription>Fastest moving pace</CardDescription>
              <p
                className="mt-0.5 truncate text-xs text-foreground"
                title={prs.fastestPace.track.name}
              >
                {prs.fastestPace.track.name}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              {formatPace(prs.fastestPace.paceMinPerKm)}
            </Badge>
          </div>
        )}

        {prs.fastestSpeed && (
          <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
            <div className="min-w-0">
              <CardDescription>Fastest avg speed</CardDescription>
              <p
                className="mt-0.5 truncate text-xs text-foreground"
                title={prs.fastestSpeed.track.name}
              >
                {prs.fastestSpeed.track.name}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              {prs.fastestSpeed.speedKmh.toFixed(1)} km/h
            </Badge>
          </div>
        )}

        {prs.longestMovingTime && (
          <div className="flex items-start justify-between gap-3 border-t border-border pt-3">
            <div className="min-w-0">
              <CardDescription>Longest moving time</CardDescription>
              <p
                className="mt-0.5 truncate text-xs text-foreground"
                title={prs.longestMovingTime.track.name}
              >
                {prs.longestMovingTime.track.name}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              {formatMovingTime(prs.longestMovingTime.movingTimeMs)}
            </Badge>
          </div>
        )}

        {!prs.longestActivity && (
          <CardDescription>No data yet.</CardDescription>
        )}
      </CardContent>
    </Card>
  )
}
