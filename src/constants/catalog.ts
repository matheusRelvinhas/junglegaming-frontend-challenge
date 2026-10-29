import type { CatalogSort, CollectionSlug, Network } from '@/types/api'

export const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: 'recent', label: 'Listados recentemente' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'name', label: 'Nome (A–Z)' },
]

export const COLLECTIONS: { slug: CollectionSlug; label: string }[] = [
  { slug: 'digital-art', label: 'Arte digital' },
  { slug: 'photography', label: 'Fotografia' },
  { slug: 'music', label: 'Música' },
  { slug: '3d-art', label: 'Arte 3D' },
  { slug: 'collectibles', label: 'Colecionáveis' },
  { slug: 'generative', label: 'Generativa' },
  { slug: 'gaming', label: 'Jogos' },
  { slug: 'subscriptions', label: 'Assinaturas' },
  { slug: 'utility', label: 'Utilidade' },
]

export const NETWORKS: { slug: Network; label: string }[] = [
  { slug: 'ethereum', label: 'Ethereum' },
  { slug: 'polygon', label: 'Polygon' },
  { slug: 'solana', label: 'Solana' },
]

export const NETWORK_OPTIONS = NETWORKS.map((network) => ({ value: network.slug, label: network.label }))

export function getNetworkLabel(network: Network) {
  return NETWORKS.find((item) => item.slug === network)?.label
}

export const RAIL_SIZE = 5

export const STAY_IN_PLACE = { hash: true, resetScroll: false, hashScrollIntoView: false } as const

export const SEARCH_INPUT_ID = 'search-nfts'
export const FILTER_DIALOG_ID = 'catalog-filters-dialog'
export const CATALOG_SECTION_ID = 'catalogo'
