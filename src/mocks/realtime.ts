import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { MOCK_COMMANDS, REALTIME_COMMANDS, REALTIME_URL } from '@/constants/realtime'
import type { MarketAction, NftUpdatedEvent, RealtimeEvent } from '@/types/api'
import { findUserIdByToken } from './auth'
import { resetMarket, updateNftMarket } from './market'

const ENGINE_IO_PING = '2'
const PING_INTERVAL_MS = 25_000

type SocketIoClient = ReturnType<typeof toSocketIo>['client']
type ConnectedClient = { client: SocketIoClient; userId: string | null; close: () => void }
type Broadcast = { events: RealtimeEvent[]; ownerId: string | null }

const realtime = ws.link(REALTIME_URL)
const otherTabs = new BroadcastChannel('kurio:mock-realtime')
let connectedClients: ConnectedClient[] = []
let lastBroadcast: Broadcast | null = null
let nftEventHistory: NftUpdatedEvent[] = []

function emitInThisTab({ events, ownerId }: Broadcast) {
  const recipients = ownerId ? connectedClients.filter((connected) => connected.userId === ownerId) : connectedClients
  events.forEach((event) => {
    recipients.forEach((recipient) => recipient.client.emit(event.type, event))
  })
}

export function publish(events: RealtimeEvent[], ownerId: string | null = null) {
  const broadcast = { events, ownerId }
  lastBroadcast = broadcast
  events.forEach((event) => {
    if (event.type === 'nft.updated') nftEventHistory = [...nftEventHistory, event]
  })
  emitInThisTab(broadcast)
  otherTabs.postMessage(broadcast)
}

function replayLastEvent() {
  if (lastBroadcast) emitInThisTab(lastBroadcast)
}

function sendStaleEvent() {
  const lastEvent = nftEventHistory.at(-1)
  const olderEvent = nftEventHistory.filter((event) => event.resource.id === lastEvent?.resource.id).at(-2)
  if (olderEvent) emitInThisTab({ events: [{ ...olderEvent, eventId: crypto.randomUUID() }], ownerId: null })
}

function dropConnections() {
  connectedClients.forEach((connected) => connected.close())
}

otherTabs.addEventListener('message', (message: MessageEvent<Broadcast>) => emitInThisTab(message.data))

export const realtimeHandler = realtime.addEventListener('connection', (connection) => {
  const { client } = toSocketIo(connection)
  const connected: ConnectedClient = { client, userId: null, close: () => connection.client.close() }
  connectedClients.push(connected)
  const pingTimer = window.setInterval(() => connection.client.send(ENGINE_IO_PING), PING_INTERVAL_MS)

  connection.client.addEventListener('close', () => {
    window.clearInterval(pingTimer)
    connectedClients = connectedClients.filter((item) => item !== connected)
  })

  client.on(REALTIME_COMMANDS.joinSession, (_message, token: string | null) => {
    connected.userId = findUserIdByToken(token)
  })

  client.on(MOCK_COMMANDS.nftAction, (_message, nftId: number, action: MarketAction) => {
    const event = updateNftMarket(nftId, action)
    if (event) publish([event])
  })

  client.on(MOCK_COMMANDS.resetMarket, () => publish(resetMarket()))
  client.on(MOCK_COMMANDS.replayLastEvent, replayLastEvent)
  client.on(MOCK_COMMANDS.sendStaleEvent, sendStaleEvent)
  client.on(MOCK_COMMANDS.dropConnection, dropConnections)
})
