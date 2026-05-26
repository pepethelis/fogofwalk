import { Link } from "react-router"
import { ArrowLeft } from "@phosphor-icons/react"
import type { Route } from "./+types/help"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "How it works — Fog of Walk" },
    {
      name: "description",
      content:
        "Learn how to use Fog of Walk: supported file formats (GPX, FIT), how to add photos, workflow tips, and troubleshooting.",
    },
  ]
}

export default function HelpPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a1e", color: "#e5e7eb" }}>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to map
        </Link>

        <h1 className="mb-10 text-3xl font-bold tracking-tight text-white">
          How Fog of Walk works
        </h1>

        {/* What is Fog of Walk */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-white">What is Fog of Walk?</h2>
          <div className="space-y-3 text-sm leading-relaxed text-gray-300">
            <p>
              Fog of Walk turns your activity files into a living map of your world. The entire map
              starts covered in fog — and every route you've ever walked, run, or cycled gradually
              clears it away, revealing the areas you've actually explored.
            </p>
            <p>
              It's a way to see your city (or the world) through the lens of your own movement.
              After importing your activities you'll quickly spot the neighbourhoods you know well,
              the streets you've never set foot on, and the blank patches just waiting to be
              discovered.
            </p>
            <p>
              <strong className="text-white">Why people use it:</strong>
            </p>
            <ul className="ml-4 list-disc space-y-1 text-gray-400">
              <li>Visualise how much of your city you've explored over months or years</li>
              <li>Set a goal to clear a whole district, borough, or country</li>
              <li>Find new routes by spotting the gaps in the fog near familiar areas</li>
              <li>Attach photos to your routes and build a personal map of memories</li>
            </ul>
          </div>
        </section>

        <hr className="mb-10 border-white/10" />

        {/* How it works */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-white">Workflow</h2>
          <ol className="space-y-3 text-sm leading-relaxed text-gray-300">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                1
              </span>
              <span>
                <strong className="text-white">Import activity files</strong> — upload{" "}
                <code className="rounded bg-white/10 px-1 py-0.5 text-xs">.gpx</code> or{" "}
                <code className="rounded bg-white/10 px-1 py-0.5 text-xs">.fit</code> files from
                your device. Multiple files are supported; you can add more at any time.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                2
              </span>
              <span>
                <strong className="text-white">Fog clears along your routes</strong> — a 100 m
                corridor is revealed around each track. Enable <em>Fill loops</em> to also clear
                the interior of closed loops (e.g. a park circuit).
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                3
              </span>
              <span>
                <strong className="text-white">Add photos (optional)</strong> — upload JPEG or HEIC
                photos. They appear as markers on the map at the location where you were when the
                photo was taken, matched by timestamp.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-400">
                4
              </span>
              <span>
                <strong className="text-white">Everything stays in your browser</strong> — no
                account, no server. Your data is stored locally in your browser and never uploaded
                anywhere.
              </span>
            </li>
          </ol>
        </section>

        <hr className="mb-10 border-white/10" />

        {/* Supported file formats */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-white">Supported file formats</h2>

          <div className="mb-5 rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="mb-1 font-semibold text-white">
              GPX{" "}
              <span className="text-xs font-normal text-gray-400">GPS Exchange Format</span>
            </h3>
            <p className="mb-3 text-sm text-gray-300">
              The most common GPS format. Exported by nearly every fitness app.
            </p>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>
                <strong className="text-gray-200">Strava</strong> — Activity page → ⋯ → Export GPX
              </li>
              <li>
                <strong className="text-gray-200">Garmin Connect</strong> — Activity → ⋯ → Export
                Original (or Export GPX)
              </li>
              <li>
                <strong className="text-gray-200">AllTrails</strong> — Activity → Export → GPX
              </li>
              <li>
                <strong className="text-gray-200">Komoot</strong> — Tour page → ↓ → GPX
              </li>
              <li>
                <strong className="text-gray-200">Wahoo</strong> — Workout → Export → GPX
              </li>
              <li>
                <strong className="text-gray-200">Apple Watch</strong> — via WorkOutDoors or
                HealthExport apps
              </li>
              <li>
                <strong className="text-gray-200">Polar, Suunto, COROS</strong> — check the
                activity export menu in their web or mobile apps
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="mb-1 font-semibold text-white">
              FIT{" "}
              <span className="text-xs font-normal text-gray-400">
                Flexible &amp; Interoperable Data Transfer
              </span>
            </h3>
            <p className="mb-3 text-sm text-gray-300">
              Binary format from Garmin devices. Contains the same GPS data as GPX.
            </p>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>
                <strong className="text-gray-200">Garmin Connect</strong> — Activity → ⋯ → Export
                Original (gives a <code className="text-xs">.fit</code> file)
              </li>
              <li>
                <strong className="text-gray-200">Cycling computers</strong> — Wahoo, Hammerhead,
                Bryton, and others save activities as FIT files
              </li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              If your app offers both GPX and FIT, either works — they produce identical results
              here.
            </p>
          </div>
        </section>

        <hr className="mb-10 border-white/10" />

        {/* Adding photos */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-white">Adding photos</h2>
          <div className="space-y-3 text-sm leading-relaxed text-gray-300">
            <p>
              Photos don't need GPS coordinates — location is determined by matching the photo's
              timestamp to the nearest point in your tracks.
            </p>
            <p>
              <strong className="text-white">Requirements:</strong>
            </p>
            <ul className="ml-4 list-disc space-y-1 text-gray-400">
              <li>
                JPEG (<code className="rounded bg-white/10 px-1 text-xs">.jpg</code> /{" "}
                <code className="rounded bg-white/10 px-1 text-xs">.jpeg</code>) or HEIC format
              </li>
              <li>
                An embedded EXIF timestamp (<em>DateTimeOriginal</em>) — present in photos taken
                with a phone or camera, but often missing in screenshots or edited photos
              </li>
              <li>Activity tracks must be loaded first</li>
              <li>Photo must be taken within 5 minutes of a recorded track point</li>
            </ul>
            <p className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-200/90">
              <strong>Photos not showing up?</strong> The most common reasons: no tracks loaded
              yet, photo has no timestamp (screenshot or edited photo), or the photo was taken more
              than 5 minutes before or after any tracked activity.
            </p>
          </div>
        </section>

        <hr className="mb-10 border-white/10" />

        {/* Troubleshooting */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-white">Troubleshooting</h2>
          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <p className="mb-1 font-medium text-white">
                File picker doesn't open / nothing happens after selecting files
              </p>
              <p className="text-gray-400">
                Some in-app browsers (Telegram, Instagram, Facebook, etc.) restrict file access.
                Open this page in your device's native browser — <strong>Safari</strong> on iOS or{" "}
                <strong>Chrome</strong> on Android — for full functionality.
              </p>
            </div>
            <div>
              <p className="mb-1 font-medium text-white">Track looks wrong or incomplete</p>
              <p className="text-gray-400">
                Some apps trim GPS data when exporting. Try exporting as a different format (e.g.
                FIT instead of GPX from Garmin Connect) or use the original file from your device
                if available.
              </p>
            </div>
            <div>
              <p className="mb-1 font-medium text-white">My data disappeared after closing the tab</p>
              <p className="text-gray-400">
                Data is stored in your browser's IndexedDB. Clearing browser data / site data will
                erase it. Private/incognito mode may not persist data between sessions.
              </p>
            </div>
          </div>
        </section>

        <div className="pt-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to map
          </Link>
        </div>
      </div>
    </div>
  )
}
