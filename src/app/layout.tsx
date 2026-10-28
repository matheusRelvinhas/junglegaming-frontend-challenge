import type { ReactNode } from 'react'
import { Footer } from '@/components/layout/Footer'
import { DesktopHeader, MobileTabBar, MobileTopBar } from '@/components/layout/Navigation'
import { useAppContext } from '@/context/AppContext'

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { isMobile } = useAppContext()

  return (
    <div className="flex min-h-dvh flex-col">
      {isMobile ? <MobileTopBar /> : <DesktopHeader />}
      <main className="container mx-auto flex-1 px-6 pt-2 pb-16 desktop:pt-8 desktop:pb-0">{children}</main>
      {isMobile ? <MobileTabBar /> : <Footer />}
    </div>
  )
}
