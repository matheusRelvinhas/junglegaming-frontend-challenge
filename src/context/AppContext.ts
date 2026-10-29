import { createContext, useContext } from 'react'
import type { Coupon, Order, User } from '@/types/api'

const MOBILE_BREAKPOINT = 1040
export const MOBILE_MEDIA_QUERY = `(width < ${MOBILE_BREAKPOINT}px)`

export type CartItem = {
  nft_id: number
  edition: string
  quantity: number
}

export function isSameCartItem(item: CartItem, nftId: number, edition: string) {
  return item.nft_id === nftId && item.edition === edition
}

export type PriceChange = {
  nft_id: number
  name: string
  previous_price: string
  price: string
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
  updateCartQuantity: (nftId: number, edition: string, quantity: number) => void
  removeFromCart: (nftId: number, edition: string) => void
  coupon: Coupon | null
  setCoupon: (coupon: Coupon | null) => void
  removePurchasedItems: (order: Order) => void
  favoriteIds: number[]
  toggleFavorite: (nftId: number) => void
  favoriteError: string
  sessionToken: string | null
  user: User | null
  isCheckingSession: boolean
  startSession: (token: string, user: User) => void
  signOut: () => void
  priceChanges: PriceChange[]
  dismissPriceChanges: (nftIds: number[]) => void
  realtimeMessage: string
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext deve ser usado dentro de <AppProvider>')
  }
  return context
}
