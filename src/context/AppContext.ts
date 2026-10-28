import { createContext, useContext } from 'react'

export const MOBILE_BREAKPOINT = 1040
export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 0.02}px)`

export type AppContextValue = {
  isMobile: boolean
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext deve ser usado dentro de <AppProvider>')
  }
  return context
}
