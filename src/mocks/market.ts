import Big from 'big.js'
import { STORAGE_KEYS } from '@/constants/storage'
import type { MarketAction, Nft, NftEdition, NftUpdatedEvent } from '@/types/api'
import { readStoredJson } from '@/utils/storage'
import nftDetailsData from './data/nft-details.json'
import nftsData from './data/nfts.json'

const MIN_PRICE = '0.01'
const PRICE_FACTORS = { 'price-up': '1.1', 'price-down': '0.9' }

type NftMarket = {
  id: number
  price: string
  editions: NftEdition[]
  version: number
}

const fixtureNfts = nftsData as Omit<Nft, 'version'>[]
const fixtureDetails = nftDetailsData as { id: number; editions: NftEdition[] }[]

function getInitialMarket(): NftMarket[] {
  return fixtureNfts.map((nft) => ({
    id: nft.id,
    price: nft.currency.ethereum,
    editions: fixtureDetails.find((detail) => detail.id === nft.id)?.editions ?? [],
    version: 1,
  }))
}

function getMarket() {
  return readStoredJson<NftMarket[] | null>(STORAGE_KEYS.mockMarket, null) ?? getInitialMarket()
}

function saveMarket(market: NftMarket[]) {
  localStorage.setItem(STORAGE_KEYS.mockMarket, JSON.stringify(market))
}

export function getNfts(): Nft[] {
  const market = getMarket()
  return fixtureNfts.map((nft) => {
    const nftMarket = market.find((item) => item.id === nft.id)
    return {
      ...nft,
      currency: { ...nft.currency, ethereum: nftMarket?.price ?? nft.currency.ethereum },
      version: nftMarket?.version ?? 1,
    }
  })
}

export function getNftEditions(nftId: number) {
  return getMarket().find((item) => item.id === nftId)?.editions ?? []
}

export function getTokenId(nft: Pick<Nft, 'name'>) {
  return `#${nft.name.split('#')[1].padStart(4, '0')}`
}

function hasSameValues(first: NftMarket, second: NftMarket) {
  const hasSameStock = first.editions.every((edition, index) => edition.available === second.editions[index]?.available)
  return first.price === second.price && hasSameStock
}

function toNftUpdatedEvent(nftMarket: NftMarket): NftUpdatedEvent {
  return {
    eventId: crypto.randomUUID(),
    type: 'nft.updated',
    resource: { type: 'nft', id: nftMarket.id },
    version: nftMarket.version,
    occurredAt: new Date().toISOString(),
    data: {
      price: nftMarket.price,
      editions: nftMarket.editions.map((edition) => ({ id: edition.id, available: edition.available })),
    },
  }
}

function changePrice(price: string, factor: string) {
  const newPrice = new Big(price).times(factor).round(2)
  return newPrice.lt(MIN_PRICE) ? MIN_PRICE : newPrice.toFixed(2)
}

function applyAction(nftMarket: NftMarket, action: MarketAction): NftMarket {
  if (action === 'price-up' || action === 'price-down') {
    return { ...nftMarket, price: changePrice(nftMarket.price, PRICE_FACTORS[action]) }
  }

  if (action === 'sell-out') {
    const editionInStock = nftMarket.editions.find((edition) => edition.available > 0)
    const editions = nftMarket.editions.map((edition) =>
      edition.id === editionInStock?.id ? { ...edition, available: 0 } : edition,
    )
    return { ...nftMarket, editions }
  }

  const initialEditions = getInitialMarket().find((item) => item.id === nftMarket.id)?.editions ?? nftMarket.editions
  return { ...nftMarket, editions: initialEditions }
}

export function updateNftMarket(nftId: number, action: MarketAction) {
  const market = getMarket()
  const currentNft = market.find((item) => item.id === nftId)
  if (!currentNft) return null

  const changedNft = applyAction(currentNft, action)
  if (hasSameValues(changedNft, currentNft)) return null

  const updatedNft = { ...changedNft, version: currentNft.version + 1 }
  saveMarket(market.map((item) => (item.id === nftId ? updatedNft : item)))
  return toNftUpdatedEvent(updatedNft)
}

export function sellEditions(soldItems: { nft_id: number; edition: string; quantity: number }[]) {
  const market = getMarket()
  const events: NftUpdatedEvent[] = []

  const updatedMarket = market.map((nftMarket) => {
    const soldItemsOfNft = soldItems.filter((item) => item.nft_id === nftMarket.id)
    if (soldItemsOfNft.length === 0) return nftMarket

    const editions = nftMarket.editions.map((edition) => {
      const soldItem = soldItemsOfNft.find((item) => item.edition === edition.id)
      return soldItem ? { ...edition, available: Math.max(0, edition.available - soldItem.quantity) } : edition
    })
    const updatedNft = { ...nftMarket, editions, version: nftMarket.version + 1 }
    events.push(toNftUpdatedEvent(updatedNft))
    return updatedNft
  })

  saveMarket(updatedMarket)
  return events
}

export function resetMarket() {
  const market = getMarket()
  const restoredMarket: NftMarket[] = []
  const events: NftUpdatedEvent[] = []

  getInitialMarket().forEach((initialNft) => {
    const currentNft = market.find((item) => item.id === initialNft.id) ?? initialNft
    if (hasSameValues(initialNft, currentNft)) {
      restoredMarket.push(currentNft)
      return
    }
    const restoredNft = { ...initialNft, version: currentNft.version + 1 }
    restoredMarket.push(restoredNft)
    events.push(toNftUpdatedEvent(restoredNft))
  })

  saveMarket(restoredMarket)
  return events
}
