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
  version: number
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

export type Banner = {
  title: string
  description: string
  img_url: string
}

export type Coupon = {
  code: string
  discount_percent: number
}

export type User = {
  id: string
  name: string
  email: string
}

export type LoginBody = {
  email: string
  password: string
}

export type RegisterBody = LoginBody & {
  name: string
}

export type AuthResponse = {
  token: string
  user: User
}

export type UserResponse = {
  user: User
}

export type Profile = {
  name: string
  email: string
  username: string
  ens_name: string
  wallet_nickname: string
  avatar_url: string | null
}

export type ProfileResponse = {
  profile: Profile
  user: User
}

export type ChangePasswordBody = {
  current_password: string
  new_password: string
}

export type Wallet = {
  nickname: string
  network: Network | ''
  address: string
  wallet_type: string
}

export type Wallets = {
  primary: Wallet | null
  secondary: Wallet | null
  secondary_same_as_primary: boolean
}

export type FavoritesResponse = {
  nft_ids: number[]
}

export type NftUpdatedEvent = {
  eventId: string
  type: 'nft.updated'
  resource: { type: 'nft'; id: number }
  version: number
  occurredAt: string
  data: {
    price: string
    editions: { id: string; available: number }[]
  }
}

export type MarketAction = 'price-up' | 'price-down' | 'sell-out' | 'restock'

export type WalletProvider = 'walletconnect' | 'metamask' | 'coinbase'

export type QuoteItem = {
  nft_id: number
  edition: string
  quantity: number
}

export type QuoteBody = {
  items: QuoteItem[]
  coupon_code: string | null
}

export type QuoteLine = QuoteItem & {
  name: string
  token_id: string
  url_img: string
  edition_label: string
  price: string
  requested_quantity: number
  line_total: string
}

export type Quote = {
  quote_id: string
  lines: QuoteLine[]
  warnings: string[]
  coupon: Coupon | null
  coupon_error: string | null
  subtotal: string
  discount: string
  network_fee: string
  total: string
}

export type CheckoutProfile = {
  display_name: string
  username: string
  profile_name: string
  wallet_address: string
  secondary_wallet: string
  wallet_type: string
  referral_code: string
  email: string
  ens_name: string
  use_secondary_wallet: boolean
  note: string
}

export type CreateOrderBody = QuoteBody & {
  quote_id: string
  network: Network
  wallet_provider: WalletProvider
  profile: CheckoutProfile
}

export type OrderStatus = 'pending' | 'confirmed' | 'declined'

export type Order = {
  id: string
  status: OrderStatus
  version: number
  created_at: string
  lines: QuoteLine[]
  subtotal: string
  discount: string
  network_fee: string
  total: string
  network: Network
  wallet_provider: WalletProvider
  wallet_address: string
  tx_hash: string | null
  decline_reason: string | null
}

export type WalletConnection = {
  provider: WalletProvider
  network: Network
  address: string
}

export type OrderUpdatedEvent = {
  eventId: string
  type: 'order.updated'
  resource: { type: 'order'; id: string }
  version: number
  occurredAt: string
  data: Pick<Order, 'status' | 'tx_hash' | 'decline_reason'>
}

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent

export type ApiError = {
  status: number | null
  message: string
  field?: string
  code?: string
}
