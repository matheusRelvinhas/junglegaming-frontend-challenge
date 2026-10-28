import { useNavigate, useSearch } from '@tanstack/react-router'
import { STAY_IN_PLACE } from '@/constants/catalog'
import type { ListNftsParams } from '@/types/api'

export function useCatalogSearch() {
  const filters: ListNftsParams = useSearch({ strict: false })
  const navigate = useNavigate()

  function updateCatalogSearch(changes: Partial<ListNftsParams>) {
    navigate({ to: '/', search: (previous) => ({ ...previous, page: undefined, ...changes }), ...STAY_IN_PLACE })
  }

  function clearCatalogSearch() {
    navigate({ to: '/', search: {}, ...STAY_IN_PLACE })
  }

  return { filters, updateCatalogSearch, clearCatalogSearch }
}
