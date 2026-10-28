import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

const worker = setupWorker(...handlers)
const startOptions = { onUnhandledFrame: 'bypass' } as const
let reconnecting: Promise<void> | null = null

export async function startMocks() {
  await worker.start(startOptions)
}

async function restartWorker() {
  await worker.stop()
  await startMocks()
}

export function reconnectMocks() {
  if (!reconnecting) {
    reconnecting = restartWorker().finally(() => {
      reconnecting = null
    })
  }
  return reconnecting
}
