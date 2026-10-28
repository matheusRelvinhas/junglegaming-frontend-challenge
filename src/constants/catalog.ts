import type { CollectionSlug, Network } from '@/types/api'

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

export const SEARCH_INPUT_ID = 'search-nfts'
export const FILTER_DIALOG_ID = 'catalog-filters-dialog'
export const CATALOG_SECTION_ID = 'catalogo'
