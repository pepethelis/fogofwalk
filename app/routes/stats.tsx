import { Link, useLoaderData } from "react-router"
import { ArrowLeft, Footprints } from "@phosphor-icons/react"
import type { Route } from "./+types/stats"
import { loadTracks } from "~/lib/storage"
import {
  computeLifetimeTotals,
  computeWeeklyBars,
  computeStreaks,
  computePersonalRecords,
  type LifetimeTotals,
  type WeeklyBar,
  type Streaks,
  type PersonalRecords,
} from "~/lib/statsAggregator"
import { StatCards } from "~/components/stats/StatCards"
import { WeeklyChart } from "~/components/stats/WeeklyChart"
import { StreaksCard } from "~/components/stats/StreaksCard"
import { PersonalRecordsCard } from "~/components/stats/PersonalRecordsCard"

// ─── Loader ───────────────────────────────────────────────────────────────────

interface StatsLoaderData {
  totals: LifetimeTotals
  weekly: WeeklyBar[]
  streaks: Streaks
  prs: PersonalRecords
}

export async function clientLoader(): Promise<StatsLoaderData> {
  const tracks = await loadTracks()
  const now = Date.now()
  return {
    totals: computeLifetimeTotals(tracks),
    weekly: computeWeeklyBars(tracks),
    streaks: computeStreaks(tracks, now),
    prs: computePersonalRecords(tracks),
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Stats — Fog of Walk" },
    { name: "description", content: "Your lifetime activity statistics." },
  ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const { totals, weekly, streaks, prs } = useLoaderData<typeof clientLoader>()
  const isEmpty = totals.totalTracks === 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* ── Header ── */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to map
        </Link>
        <h1 className="mb-8 text-2xl font-bold tracking-tight">Your Stats</h1>

        {isEmpty ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center gap-3 rounded-none border border-dashed border-border py-24 text-center">
            <Footprints size={40} className="text-muted-foreground" weight="duotone" />
            <p className="text-sm text-muted-foreground">
              Import some tracks to see your stats.
            </p>
            <Link
              to="/"
              className="mt-1 text-sm font-medium underline underline-offset-4 transition-colors hover:text-muted-foreground"
            >
              Go to map →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <StatCards totals={totals} longestStreakDays={streaks.longestStreakDays} />
            <WeeklyChart weekly={weekly} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StreaksCard streaks={streaks} />
              <PersonalRecordsCard prs={prs} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
