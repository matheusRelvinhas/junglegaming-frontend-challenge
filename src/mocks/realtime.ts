import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { MOCK_COMMANDS, REALTIME_URL } from '@/constants/realtime'
import type { MarketAction, NftUpdatedEvent } from '@/types/api'
import { resetMarket, updateNftMarket } from './market'

const ENGINE_IO_PING = '2'
const PING_INTERVAL_MS = 25_000

type SocketIoClient = ReturnType<typeof toSocketIo>['client']

const realtime = ws.link(REALTIME_URL)
const otherTabs = new BroadcastChannel('kurio:mock-realtime')
let connectedClients: SocketIoClient[] = []

function emitInThisTab(events: NftUpdatedEvent[]) {
  events.forEach((event) => {
    connectedClients.forEach((client) => client.emit(event.type, event))
  })
}

function publish(events: NftUpdatedEvent[]) {
  emitInThisTab(events)
  otherTabs.postMessage(events)
}

otherTabs.addEventListener('message', (message: MessageEvent<NftUpdatedEvent[]>) => emitInThisTab(message.data))

export const realtimeHandler = realtime.addEventListener('connection', (connection) => {
  const { client } = toSocketIo(connection)
  connectedClients.push(client)
  const pingTimer = window.setInterval(() => connection.client.send(ENGINE_IO_PING), PING_INTERVAL_MS)

  connection.client.addEventListener('close', () => {
    window.clearInterval(pingTimer)
    connectedClients = connectedClients.filter((connectedClient) => connectedClient !== client)
  })

  client.on(MOCK_COMMANDS.nftAction, (_message, nftId: number, action: MarketAction) => {
    const event = updateNftMarket(nftId, action)
    if (event) publish([event])
  })

  client.on(MOCK_COMMANDS.resetMarket, () => publish(resetMarket()))
})
