import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useCatalogSearch } from '@/hooks/useCatalogSearch'
import { AppContext, MOBILE_MEDIA_QUERY, type CartItem } from './AppContext'

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
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(storageKey)
      return storedValue ? (JSON.parse(storedValue) as T) : fallback
    } catch {
      return fallback
    }
  })

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
  const [cartItems, setCartItems] = usePersistedState<CartItem[]>('kurio:cart', [])
  const [favoriteIds, setFavoriteIds] = usePersistedState<number[]>('kurio:favorites', [])

  const addToCart = useCallback(
    (newItem: CartItem) => {
      setCartItems((items) => {
        const isSameItem = (item: CartItem) => item.nft_id === newItem.nft_id && item.edition === newItem.edition
        if (!items.some(isSameItem)) return [...items, newItem]
        return items.map((item) => (isSameItem(item) ? { ...item, quantity: item.quantity + newItem.quantity } : item))
      })
    },
    [setCartItems],
  )

  const toggleFavorite = useCallback(
    (nftId: number) => {
      setFavoriteIds((ids) => (ids.includes(nftId) ? ids.filter((id) => id !== nftId) : [...ids, nftId]))
    },
    [setFavoriteIds],
  )

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  const { filters, updateCatalogSearch } = useCatalogSearch()
  const searchInUrl = filters.search ?? ''
  const [search, setSearchText] = useState(searchInUrl)
  const [syncedSearchInUrl, setSyncedSearchInUrl] = useState(searchInUrl)
  const searchTimer = useRef<number>(undefined)

  if (searchInUrl !== syncedSearchInUrl) {
    setSyncedSearchInUrl(searchInUrl)
    setSearchText(searchInUrl)
  }

  const setSearch = useCallback(
    (text: string) => {
      setSearchText(text)
      window.clearTimeout(searchTimer.current)
      searchTimer.current = window.setTimeout(
        () => updateCatalogSearch({ search: text || undefined }),
        SEARCH_DEBOUNCE_MS,
      )
    },
    [updateCatalogSearch],
  )

  const value = useMemo(
    () => ({
      isMobile,
      search,
      setSearch,
      isFilterOpen,
      setIsFilterOpen,
      cartItems,
      cartCount,
      addToCart,
      favoriteIds,
      toggleFavorite,
    }),
    [isMobile, search, setSearch, isFilterOpen, cartItems, cartCount, addToCart, favoriteIds, toggleFavorite],
  )

  return <AppContext value={value}>{children}</AppContext>
}
