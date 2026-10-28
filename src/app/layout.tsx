import { lazy, Suspense, type ReactNode } from 'react'
import { AuthDialog } from '@/components/AuthDialog'
import { Footer } from '@/components/layout/Footer'
import { DesktopHeader, MobileTabBar, MobileTopBar } from '@/components/layout/Navigation'
import { useAppContext } from '@/context/AppContext'

const MockPanel =
  import.meta.env.VITE_ENABLE_MOCKS === 'true'
    ? lazy(() => import('@/mocks/MockPanel').then((module) => ({ default: module.MockPanel })))
    : null

type LayoutProps = {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { isMobile, realtimeMessage } = useAppContext()

  return (
    <div className="flex min-h-dvh flex-col">
      {isMobile ? <MobileTopBar /> : <DesktopHeader />}
      <main className="container mx-auto flex-1 px-6 pt-2 pb-16 desktop:pt-8 desktop:pb-0">{children}</main>
      {isMobile ? <MobileTabBar /> : <Footer />}
      <AuthDialog />
      <p aria-live="polite" className="sr-only">
        {realtimeMessage}
      </p>
      {MockPanel && (
        <Suspense fallback={null}>
          <MockPanel />
        </Suspense>
      )}
    </div>
  )
}
