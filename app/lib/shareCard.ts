import type { ParsedTrack } from "~/types/tracks"
import type { PhotoEntry } from "~/types/photos"

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatKey =
  | "distance"
  | "duration"
  | "movingTime"
  | "avgPace"
  | "avgMovingPace"
  | "avgSpeed"
  | "avgMovingSpeed"
  | "elevationGain"
  | "elevationLoss"

export interface StatDef {
  /** Label shown in the dialog toggle chips */
  label: string
  /** Returns the large value string drawn on the card */
  getValue: (track: ParsedTrack) => string
  /** Small unit / descriptor drawn below the value */
  unit: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1440

const TRACK_COLOR = "#ff6b35"
const FOG_COLOR = "#0a0a1e"
const FONT_FAMILY = "'JetBrains Mono Variable', 'JetBrains Mono', monospace"

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

function fmtPace(minPerKm: number): string {
  const m = Math.floor(minPerKm)
  const s = Math.round((minPerKm - m) * 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

// ─── Stat definitions ─────────────────────────────────────────────────────────

export const STAT_DEFS: Record<StatKey, StatDef> = {
  distance: {
    label: "Distance",
    getValue: (t) => t.stats.distanceKm.toFixed(2),
    unit: "km",
  },
  duration: {
    label: "Duration",
    getValue: (t) => fmtDuration(t.stats.durationMs ?? 0),
    unit: "duration",
  },
  movingTime: {
    label: "Moving time",
    getValue: (t) => fmtDuration(t.stats.movingTimeMs ?? 0),
    unit: "moving",
  },
  avgPace: {
    label: "Avg pace",
    getValue: (t) => fmtPace(t.stats.avgPaceMinPerKm ?? 0),
    unit: "min / km",
  },
  avgMovingPace: {
    label: "Moving pace",
    getValue: (t) => fmtPace(t.stats.avgMovingPaceMinPerKm ?? 0),
    unit: "mov / km",
  },
  avgSpeed: {
    label: "Speed",
    getValue: (t) => (t.stats.avgSpeedKmh ?? 0).toFixed(1),
    unit: "km / h",
  },
  avgMovingSpeed: {
    label: "Moving speed",
    getValue: (t) => (t.stats.avgMovingSpeedKmh ?? 0).toFixed(1),
    unit: "mov km / h",
  },
  elevationGain: {
    label: "Elev. gain",
    getValue: (t) => Math.round(t.stats.elevationGainM).toString(),
    unit: "m  ↑",
  },
  elevationLoss: {
    label: "Elev. loss",
    getValue: (t) => Math.round(t.stats.elevationLossM).toString(),
    unit: "m  ↓",
  },
}

// ─── Availability & defaults ──────────────────────────────────────────────────

export function getAvailableStats(track: ParsedTrack): StatKey[] {
  const { stats } = track
  const available: StatKey[] = ["distance"]
  if (stats.durationMs != null) available.push("duration")
  if (stats.movingTimeMs != null) available.push("movingTime")
  if (stats.avgPaceMinPerKm != null) available.push("avgPace")
  if (stats.avgMovingPaceMinPerKm != null) available.push("avgMovingPace")
  if (stats.avgSpeedKmh != null) available.push("avgSpeed")
  if (stats.avgMovingSpeedKmh != null) available.push("avgMovingSpeed")
  if (stats.hasElevation) {
    available.push("elevationGain")
    available.push("elevationLoss")
  }
  return available
}

const STAT_PRIORITY: StatKey[] = [
  "distance",
  "duration",
  "elevationGain",
  "avgPace",
  "movingTime",
  "avgSpeed",
  "elevationLoss",
  "avgMovingPace",
  "avgMovingSpeed",
]

export function getDefaultStats(track: ParsedTrack): StatKey[] {
  const available = getAvailableStats(track)
  return STAT_PRIORITY.filter((k) => available.includes(k)).slice(0, 4)
}

// ─── Photo → track matching ───────────────────────────────────────────────────

export function filterPhotosForTrack(
  photos: PhotoEntry[],
  track: ParsedTrack
): PhotoEntry[] {
  return photos.filter((p) =>
    track.coordinates.some(
      ([lng, lat]) =>
        Math.abs(lng - p.lng) < 1e-7 && Math.abs(lat - p.lat) < 1e-7
    )
  )
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

/** Draw the route as an orange line on a dark background (no-photo fallback). */
function drawRoute(
  ctx: CanvasRenderingContext2D,
  track: ParsedTrack,
  W: number,
  H: number
): void {
  const { coordinates } = track
  if (coordinates.length < 2) return

  // Subsample for performance on very long tracks
  const MAX_PTS = 2000
  const step =
    coordinates.length > MAX_PTS
      ? Math.ceil(coordinates.length / MAX_PTS)
      : 1
  const pts = coordinates.filter((_, i) => i % step === 0)

  const lngs = pts.map((c) => c[0])
  const lats = pts.map((c) => c[1])
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)

  // Route lives in the upper 65% of the canvas (below that = stats panel)
  const routeAreaH = H * 0.65
  const PAD = 0.12 // 12% padding on each side

  const geoW = maxLng - minLng || 0.001
  const geoH = maxLat - minLat || 0.001
  const availW = W * (1 - 2 * PAD)
  const availH = routeAreaH * (1 - 2 * PAD)
  const scale = Math.min(availW / geoW, availH / geoH)

  const drawnW = geoW * scale
  const drawnH = geoH * scale
  const offsetX = (W - drawnW) / 2
  const offsetY = (routeAreaH - drawnH) / 2

  const toX = (lng: number) => offsetX + (lng - minLng) * scale
  const toY = (lat: number) => offsetY + (maxLat - lat) * scale // flip Y

  const buildPath = () => {
    ctx.beginPath()
    ctx.moveTo(toX(pts[0][0]), toY(pts[0][1]))
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(toX(pts[i][0]), toY(pts[i][1]))
    }
  }

  // Soft glow
  ctx.save()
  ctx.strokeStyle = `${TRACK_COLOR}50`
  ctx.lineWidth = 22
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.shadowColor = TRACK_COLOR
  ctx.shadowBlur = 30
  buildPath()
  ctx.stroke()
  ctx.restore()

  // Main line
  ctx.save()
  ctx.strokeStyle = TRACK_COLOR
  ctx.lineWidth = 7
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  buildPath()
  ctx.stroke()
  ctx.restore()
}

// ─── Main draw function ───────────────────────────────────────────────────────

export interface ShareCardOptions {
  track: ParsedTrack
  photo: PhotoEntry | null
  enabledStats: StatKey[]
}

export async function drawShareCard(
  canvas: HTMLCanvasElement,
  opts: ShareCardOptions
): Promise<void> {
  // Ensure web fonts are loaded before measuring / drawing text
  await document.fonts.ready

  const { track, photo, enabledStats } = opts
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const W = canvas.width
  const H = canvas.height

  ctx.clearRect(0, 0, W, H)

  // ── Background ────────────────────────────────────────────────────────────

  if (photo?.file) {
    const bitmap = await createImageBitmap(photo.file)

    // Scale to cover the entire canvas (like CSS object-fit: cover)
    const scale = Math.max(W / bitmap.width, H / bitmap.height)
    const sw = bitmap.width * scale
    const sh = bitmap.height * scale
    const sx = (W - sw) / 2
    const sy = (H - sh) / 2

    // Extend image beyond edges to prevent white fringe from Gaussian blur
    const BLUR = 42
    const EXT = BLUR * 2
    ctx.save()
    ctx.filter = `blur(${BLUR}px)`
    ctx.drawImage(bitmap, sx - EXT, sy - EXT, sw + EXT * 2, sh + EXT * 2)
    ctx.restore()

    bitmap.close()

    // Dark veil over the blurred photo
    ctx.fillStyle = "rgba(10, 10, 30, 0.52)"
    ctx.fillRect(0, 0, W, H)
  } else {
    // No photo → route on dark background
    ctx.fillStyle = FOG_COLOR
    ctx.fillRect(0, 0, W, H)
    drawRoute(ctx, track, W, H)
  }

  // ── Gradient scrim (bottom portion) ──────────────────────────────────────

  const scrimStart = H * 0.52 // ~749px
  const scrim = ctx.createLinearGradient(0, scrimStart, 0, H)
  scrim.addColorStop(0, "rgba(10, 10, 30, 0)")
  scrim.addColorStop(0.3, "rgba(10, 10, 30, 0.7)")
  scrim.addColorStop(0.55, "rgba(10, 10, 30, 0.88)")
  scrim.addColorStop(1, "rgba(10, 10, 30, 0.96)")
  ctx.fillStyle = scrim
  ctx.fillRect(0, scrimStart, W, H - scrimStart)

  // ── Stats grid ────────────────────────────────────────────────────────────

  const statCount = Math.min(enabledStats.length, 4)
  const COLS = statCount <= 2 ? 1 : 2
  const ROWS = Math.ceil(statCount / COLS)

  const PAD_X = 80
  const CELL_W = (W - PAD_X * 2) / COLS
  const CELL_H = 192
  const BOTTOM_RESERVE = 76 // space below stats for watermark
  const STATS_TOP = H - ROWS * CELL_H - BOTTOM_RESERVE

  // Subtle dividers
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
  ctx.lineWidth = 1

  if (COLS === 2) {
    ctx.beginPath()
    ctx.moveTo(W / 2, STATS_TOP - 12)
    ctx.lineTo(W / 2, STATS_TOP + ROWS * CELL_H)
    ctx.stroke()
  }
  if (ROWS === 2) {
    ctx.beginPath()
    ctx.moveTo(PAD_X, STATS_TOP + CELL_H)
    ctx.lineTo(W - PAD_X, STATS_TOP + CELL_H)
    ctx.stroke()
  }

  // Stat cells
  for (let i = 0; i < statCount; i++) {
    const key = enabledStats[i]
    const def = STAT_DEFS[key]
    const col = i % COLS
    const row = Math.floor(i / COLS)

    const cellX = PAD_X + col * CELL_W
    const cellY = STATS_TOP + row * CELL_H

    // Large value
    ctx.save()
    ctx.font = `700 80px ${FONT_FAMILY}`
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "left"
    ctx.textBaseline = "alphabetic"
    ctx.fillText(def.getValue(track), cellX, cellY + 106)
    ctx.restore()

    // Unit / label below
    ctx.save()
    ctx.font = `400 27px ${FONT_FAMILY}`
    ctx.fillStyle = "rgba(255, 255, 255, 0.48)"
    ctx.textAlign = "left"
    ctx.textBaseline = "alphabetic"
    ctx.fillText(def.unit, cellX, cellY + 152)
    ctx.restore()
  }

  // ── Watermark ─────────────────────────────────────────────────────────────

  ctx.save()
  // letterSpacing: supported Chrome 99+, Safari 17.2+; guarded at runtime for older browsers
  if ("letterSpacing" in ctx) ctx.letterSpacing = "4px"
  ctx.font = `400 19px ${FONT_FAMILY}`
  ctx.fillStyle = "rgba(255, 255, 255, 0.26)"
  ctx.textAlign = "right"
  ctx.textBaseline = "alphabetic"
  ctx.fillText("FOG OF WALK", W - PAD_X, H - 30)
  ctx.restore()
}

// ─── Export ───────────────────────────────────────────────────────────────────

/** Render a full-res 1080×1440 card and trigger a PNG download. */
export async function exportShareCard(opts: ShareCardOptions): Promise<void> {
  const canvas = document.createElement("canvas")
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  // Keep off-screen
  canvas.style.cssText = "position:absolute;left:-9999px;top:-9999px"
  document.body.appendChild(canvas)

  try {
    await drawShareCard(canvas, opts)

    await new Promise<void>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob returned null"))
            return
          }
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          const safeName = opts.track.name
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/^-|-$/g, "")
            .toLowerCase()
          a.href = url
          a.download = `fogofwalk-${safeName || "activity"}.png`
          a.click()
          setTimeout(() => URL.revokeObjectURL(url), 2000)
          resolve()
        },
        "image/png"
      )
    })
  } finally {
    document.body.removeChild(canvas)
  }
}
