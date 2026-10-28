import { useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { AppContext, MOBILE_MEDIA_QUERY } from './AppContext'

function subscribeToMobileChange(onChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)
  mediaQuery.addEventListener('change', onChange)
  return () => mediaQuery.removeEventListener('change', onChange)
}

function getIsMobile() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

type AppProviderProps = {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const isMobile = useSyncExternalStore(subscribeToMobileChange, getIsMobile)
  const value = useMemo(() => ({ isMobile }), [isMobile])

  return <AppContext value={value}>{children}</AppContext>
}
