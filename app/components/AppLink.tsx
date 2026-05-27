import { Link } from "react-router"
import { ArrowLeft } from "@phosphor-icons/react"
import { cn } from "~/lib/utils"

const variants = {
  nav: "inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
  subtle: "text-xs text-foreground underline-offset-2 hover:underline",
} as const

interface AppLinkProps {
  to: string
  variant?: keyof typeof variants
  className?: string
  title?: string
  children: React.ReactNode
}

export function AppLink({ to, variant = "subtle", className, title, children }: AppLinkProps) {
  return (
    <Link to={to} className={cn(variants[variant], className)} title={title}>
      {variant === "nav" && <ArrowLeft size={16} />}
      {children}
    </Link>
  )
}
