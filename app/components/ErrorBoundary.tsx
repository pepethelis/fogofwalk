import { Component, type ReactNode } from "react"
import { WarningOctagonIcon } from "@phosphor-icons/react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card"
import { Button } from "~/components/ui/button"

interface Props {
  children: ReactNode
  /** Render this instead of the default card when an error is caught */
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset)
      }
      return <ErrorCard error={this.state.error} reset={this.reset} />
    }
    return this.props.children
  }
}

interface ErrorCardProps {
  error: Error
  reset: () => void
  className?: string
}

export function ErrorCard({ error, reset, className }: ErrorCardProps) {
  return (
    <div
      className={
        className === undefined
          ? "absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm"
          : className
      }
    >
      <Card className="w-80 bg-background/80 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <WarningOctagonIcon weight="duotone" size={20} className="text-destructive" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            {import.meta.env.DEV ? error.message : "An unexpected error occurred."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={reset}>
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
