import { delay, HttpResponse } from 'msw'
import { STORAGE_KEYS } from '@/constants/storage'
import type { MockScenario } from '@/types/mock'
import { readStoredJson, saveStoredJson } from '@/utils/storage'

const DEFAULT_SCENARIO: MockScenario = {
  wallet: 'approve',
  payment: 'confirm',
  favorites: 'success',
  latency: 'normal',
  reads: 'success',
  catalogOrder: 'in-order',
}

const SLOW_NETWORK_EXTRA_MS = 2000

export function getScenario(): MockScenario {
  return { ...DEFAULT_SCENARIO, ...readStoredJson<Partial<MockScenario>>(STORAGE_KEYS.mockScenario, {}) }
}

export function saveScenario(scenario: MockScenario) {
  saveStoredJson(STORAGE_KEYS.mockScenario, scenario)
}

export async function networkDelay() {
  await delay()
  if (getScenario().latency === 'slow') await delay(SLOW_NETWORK_EXTRA_MS)
}

export function readFailureResponse() {
  if (getScenario().reads !== 'fail') return null
  return HttpResponse.json({ message: 'Serviço indisponível no momento. Tente novamente.', code: 'TRANSIENT' }, { status: 503 })
}
