export const REALTIME_URL = 'wss://realtime.kurio.test'

export const REALTIME_COMMANDS = {
  joinSession: 'session:join',
} as const

export const MOCK_COMMANDS = {
  nftAction: 'mock:nft-action',
  resetMarket: 'mock:reset-market',
} as const
