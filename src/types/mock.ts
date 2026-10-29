export type WalletScenario = 'approve' | 'reject'
export type PaymentScenario = 'confirm' | 'decline' | 'timeout'
export type FavoritesScenario = 'success' | 'fail'
export type LatencyScenario = 'normal' | 'slow'
export type ReadsScenario = 'success' | 'fail'
export type CatalogOrderScenario = 'in-order' | 'out-of-order'

export type MockScenario = {
  wallet: WalletScenario
  payment: PaymentScenario
  favorites: FavoritesScenario
  latency: LatencyScenario
  reads: ReadsScenario
  catalogOrder: CatalogOrderScenario
}
