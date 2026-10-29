import { setupWorker } from 'msw/browser'
import { emitToRealtime, isRealtimeConnected } from '@/services/realtime'
import { handlers } from './handlers'

const worker = setupWorker(...handlers)
const startOptions = { onUnhandledFrame: 'bypass' } as const
let reconnecting: Promise<void> | null = null

declare global {
  interface Window {
    __kurioMock?: {
      sendCommand: (command: string, ...args: unknown[]) => void
      isRealtimeConnected: () => boolean
    }
  }
}

export async function startMocks() {
  await worker.start(startOptions)
  window.__kurioMock = { sendCommand: emitToRealtime, isRealtimeConnected }
}

async function restartWorker() {
  await worker.stop()
  await worker.start(startOptions)
}

export function reconnectMocks() {
  if (!reconnecting) {
    reconnecting = restartWorker().finally(() => {
      reconnecting = null
    })
  }
  return reconnecting
}
