import type { ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <main className="container mx-auto flex-1 px-6">{children}</main>
    </div>
  )
}
