import { STORAGE_KEYS } from '@/constants/storage'
import { readStoredJson, saveStoredJson } from '@/utils/storage'

export type WalletScenario = 'approve' | 'reject'
export type PaymentScenario = 'confirm' | 'decline' | 'timeout'

export type FavoritesScenario = 'success' | 'fail'

export type MockScenario = {
  wallet: WalletScenario
  payment: PaymentScenario
  favorites: FavoritesScenario
}

const DEFAULT_SCENARIO: MockScenario = { wallet: 'approve', payment: 'confirm', favorites: 'success' }

export function getScenario(): MockScenario {
  return { ...DEFAULT_SCENARIO, ...readStoredJson<Partial<MockScenario>>(STORAGE_KEYS.mockScenario, {}) }
}

export function saveScenario(scenario: MockScenario) {
  saveStoredJson(STORAGE_KEYS.mockScenario, scenario)
}
