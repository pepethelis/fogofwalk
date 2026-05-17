import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router"
import { WarningOctagon } from "@phosphor-icons/react"

import type { Route } from "./+types/root"
import "./app.css"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Something went wrong"
  let message = "An unexpected error occurred."
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? "Page not found" : `Error ${error.status}`
    message =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || message
  } else if (error instanceof Error) {
    message = import.meta.env.DEV ? error.message : message
    stack = import.meta.env.DEV ? error.stack : undefined
  }

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-background">
      {/* subtle fog-like radial gradient in the background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, #1a1a3e 0%, #0a0a1e 100%)",
        }}
      />
      <div className="relative z-10 flex w-full max-w-sm flex-col gap-4 px-4">
        <div className="flex items-center gap-3">
          <WarningOctagon weight="duotone" size={28} className="shrink-0 text-destructive" />
          <h1 className="font-heading text-base font-medium">{title}</h1>
        </div>
        <p className="text-xs/relaxed text-muted-foreground">{message}</p>
        {stack && (
          <pre className="max-h-48 overflow-auto rounded-none border border-foreground/10 bg-card/60 p-3 text-xs text-muted-foreground">
            {stack}
          </pre>
        )}
        <button
          onClick={() => window.location.reload()}
          className="w-fit cursor-pointer border border-foreground/15 bg-card/60 px-3 py-1.5 text-xs backdrop-blur-md transition-colors hover:bg-card"
        >
          Reload
        </button>
      </div>
    </div>
  )
}
