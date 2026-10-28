export type Network = 'ethereum' | 'polygon' | 'solana'

export type CollectionSlug =
  | 'digital-art'
  | 'photography'
  | 'music'
  | '3d-art'
  | 'collectibles'
  | 'generative'
  | 'gaming'
  | 'subscriptions'
  | 'utility'

export type Nft = {
  id: number
  name: string
  url_img: string
  currency: { ethereum: string; polygon: string | null; solana: string | null }
  collection: CollectionSlug
  top_nft: boolean
  rare_nft: boolean
}

export type ListNftsParams = {
  search?: string
  collection?: CollectionSlug
  network?: Network
  min_price?: number
  max_price?: number
  page?: number
  top_nft?: boolean
}

export type CatalogFacets = {
  collections: Record<CollectionSlug, number>
  networks: Record<Network, number>
  price: { min: string; max: string }
}

export type ListNftsResponse = {
  items: Nft[]
  page: number
  page_size: number
  total: number
  total_pages: number
  facets: CatalogFacets
}

export type NftEdition = {
  id: string
  label: string
  available: number
}

export type NftInfo = Nft & {
  token_id: string
  creator: string
  description: string
  details: string[]
  network_info: string
  contract_info: string
  royalties_info: string
  attributes: string[]
  rating: number
  reviews_count: number
  editions: NftEdition[]
  gallery: string[]
}

export type ApiError = {
  status: number | null
  message: string
}
