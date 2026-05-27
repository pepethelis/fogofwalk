import type { Streaks } from "~/lib/statsAggregator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { ActivityGrid } from "./ActivityGrid"

interface StreaksCardProps {
  streaks: Streaks
}

export function StreaksCard({ streaks }: StreaksCardProps) {
  const delta = streaks.thisWeekKm - streaks.lastWeekKm
  const activePercent = Math.round((streaks.activeInWindowCount / 84) * 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Streaks</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* 12-week activity grid */}
        <ActivityGrid recentDays={streaks.recentDays} />

        {/* This week + Active */}
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div>
            <CardDescription className="mb-1">This week</CardDescription>
            <p className="text-xl font-bold tabular-nums">
              {streaks.thisWeekKm.toFixed(1)} km
            </p>
            {delta !== 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {delta > 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)} km
              </p>
            )}
          </div>
          <div>
            <CardDescription className="mb-1">Active</CardDescription>
            <p className="text-xl font-bold tabular-nums">
              {streaks.activeInWindowCount}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                d ({activePercent}%)
              </span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">in 12 weeks</p>
          </div>
        </div>

        {/* Current + Longest */}
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div>
            <CardDescription className="mb-1">Current streak</CardDescription>
            <p className="text-xl font-bold tabular-nums">
              {streaks.currentStreakDays}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                d
              </span>
            </p>
          </div>
          <div>
            <CardDescription className="mb-1">Longest streak</CardDescription>
            <p className="text-xl font-bold tabular-nums">
              {streaks.longestStreakDays}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                d
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
