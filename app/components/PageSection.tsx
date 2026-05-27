interface PageSectionProps {
  title: string
  children: React.ReactNode
}

export function PageSection({ title, children }: PageSectionProps) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  )
}
