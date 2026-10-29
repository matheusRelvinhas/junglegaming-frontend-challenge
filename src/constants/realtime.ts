export const REALTIME_URL = 'wss://realtime.kurio.test'

export const REALTIME_COMMANDS = {
  joinSession: 'session:join',
} as const

export const MOCK_COMMANDS = {
  nftAction: 'mock:nft-action',
  resetMarket: 'mock:reset-market',
  replayLastEvent: 'mock:replay-last-event',
  sendStaleEvent: 'mock:send-stale-event',
  dropConnection: 'mock:drop-connection',
} as const
