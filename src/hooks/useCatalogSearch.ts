import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import type { ListNftsParams } from '@/types/api'

const stayInPlace = { hash: true, resetScroll: false, hashScrollIntoView: false } as const

export function useCatalogSearch() {
  const filters: ListNftsParams = useSearch({ strict: false })
  const navigate = useNavigate()

  const updateCatalogSearch = useCallback(
    (changes: Partial<ListNftsParams>) =>
      navigate({ to: '/', search: (previous) => ({ ...previous, page: undefined, ...changes }), ...stayInPlace }),
    [navigate],
  )

  const clearCatalogSearch = useCallback(() => navigate({ to: '/', search: {}, ...stayInPlace }), [navigate])

  return { filters, updateCatalogSearch, clearCatalogSearch }
}
