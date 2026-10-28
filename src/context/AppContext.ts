import { createContext, useContext } from 'react'

export const MOBILE_BREAKPOINT = 1040
export const MOBILE_MEDIA_QUERY = `(width < ${MOBILE_BREAKPOINT}px)`

export type CartItem = {
  nft_id: number
  edition: string
  quantity: number
}

type AppContextValue = {
  isMobile: boolean
  search: string
  setSearch: (value: string) => void
  isFilterOpen: boolean
  setIsFilterOpen: (isOpen: boolean) => void
  cartItems: CartItem[]
  cartCount: number
  addToCart: (item: CartItem) => void
  favoriteIds: number[]
  toggleFavorite: (nftId: number) => void
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext deve ser usado dentro de <AppProvider>')
  }
  return context
}
