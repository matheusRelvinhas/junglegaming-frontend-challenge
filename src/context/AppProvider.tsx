import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { STORAGE_KEYS } from '@/constants/storage'
import { useCatalogSearch } from '@/hooks/useCatalogSearch'
import { useLogout, useSession } from '@/services/auth'
import { useNftUpdates } from '@/services/realtime'
import type { User } from '@/types/api'
import { readStoredJson } from '@/utils/storage'
import { AppContext, isSameCartItem, MOBILE_MEDIA_QUERY, type CartItem } from './AppContext'

const SEARCH_DEBOUNCE_MS = 300

function subscribeToMobileChange(onChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)
  mediaQuery.addEventListener('change', onChange)
  return () => mediaQuery.removeEventListener('change', onChange)
}

function getIsMobile() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

function usePersistedState<T>(storageKey: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStoredJson(storageKey, fallback))

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // Sem localStorage (aba anônima/bloqueado): o estado segue só em memória.
    }
  }, [storageKey, value])

  return [value, setValue] as const
}

type AppProviderProps = {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const isMobile = useSyncExternalStore(subscribeToMobileChange, getIsMobile)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [cartItems, setCartItems] = usePersistedState<CartItem[]>(STORAGE_KEYS.cart, [])
  const [favoriteIds, setFavoriteIds] = usePersistedState<number[]>(STORAGE_KEYS.favorites, [])

  const { priceChanges, dismissPriceChanges, realtimeMessage } = useNftUpdates()

  const queryClient = useQueryClient()
  const logout = useLogout()
  const [sessionToken, setSessionToken] = usePersistedState<string | null>(STORAGE_KEYS.session, null)
  const session = useSession(sessionToken)
  const user = session.data?.user ?? null
  const isCheckingSession = sessionToken !== null && session.isPending

  if (session.error?.status === 401) setSessionToken(null)

  function startSession(token: string, loggedUser: User) {
    queryClient.setQueryData(['session', token], { user: loggedUser })
    setSessionToken(token)
  }

  function signOut() {
    if (sessionToken) logout.mutate(sessionToken)
    setSessionToken(null)
    queryClient.removeQueries({ queryKey: ['session'] })
  }

  function addToCart(newItem: CartItem) {
    setCartItems((items) => {
      const isNewItem = (item: CartItem) => isSameCartItem(item, newItem.nft_id, newItem.edition)
      if (!items.some(isNewItem)) return [...items, newItem]
      return items.map((item) => (isNewItem(item) ? { ...item, quantity: item.quantity + newItem.quantity } : item))
    })
  }

  function updateCartQuantity(nftId: number, edition: string, quantity: number) {
    setCartItems((items) => items.map((item) => (isSameCartItem(item, nftId, edition) ? { ...item, quantity } : item)))
  }

  function removeFromCart(nftId: number, edition: string) {
    setCartItems((items) => items.filter((item) => !isSameCartItem(item, nftId, edition)))
  }

  function toggleFavorite(nftId: number) {
    setFavoriteIds((ids) => (ids.includes(nftId) ? ids.filter((id) => id !== nftId) : [...ids, nftId]))
  }

  let cartCount = 0
  cartItems.forEach((item) => {
    cartCount += item.quantity
  })

  const { filters, updateCatalogSearch } = useCatalogSearch()
  const searchInUrl = filters.search ?? ''
  const [search, setSearchText] = useState(searchInUrl)
  const [syncedSearchInUrl, setSyncedSearchInUrl] = useState(searchInUrl)
  const searchTimer = useRef<number>(undefined)

  if (searchInUrl !== syncedSearchInUrl) {
    setSyncedSearchInUrl(searchInUrl)
    setSearchText(searchInUrl)
  }

  function setSearch(text: string) {
    setSearchText(text)
    window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => updateCatalogSearch({ search: text || undefined }), SEARCH_DEBOUNCE_MS)
  }

  return (
    <AppContext
      value={{
        isMobile,
        search,
        setSearch,
        isFilterOpen,
        setIsFilterOpen,
        cartItems,
        cartCount,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        favoriteIds,
        toggleFavorite,
        user,
        isCheckingSession,
        startSession,
        signOut,
        priceChanges,
        dismissPriceChanges,
        realtimeMessage,
      }}
    >
      {children}
    </AppContext>
  )
}
