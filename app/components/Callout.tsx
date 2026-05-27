import { cn } from "~/lib/utils"

const variants = {
  warning: "border-amber-100 bg-amber-50 text-amber-600",
  info: "border-blue-500/20 bg-blue-500/10 text-blue-300",
} as const

interface CalloutProps {
  variant?: keyof typeof variants
  className?: string
  children: React.ReactNode
}

export function Callout({
  variant = "warning",
  className,
  children,
}: CalloutProps) {
  return (
    <p
      className={cn(
        "mt-2 rounded-lg border p-3 text-sm",
        variants[variant],
        className
      )}
    >
      {children}
    </p>
  )
}
