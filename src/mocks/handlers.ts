import Big from 'big.js'
import { delay, http, HttpResponse } from 'msw'
import { COLLECTIONS, NETWORKS } from '@/constants/catalog'
import type { CatalogFacets, ListNftsResponse, Network, Nft, NftInfo } from '@/types/api'
import { range } from '@/utils/array'
import { accountHandlers } from './account'
import { authHandlers } from './auth'
import banners from './data/banners.json'
import nftDetailsData from './data/nft-details.json'
import { checkoutHandlers } from './checkout'
import { getNftEditions, getNfts, getTokenId } from './market'
import { realtimeHandler } from './realtime'
import { getScenario, networkDelay, readFailureResponse } from './scenario'

const PAGE_SIZE = 9
const GALLERY_SIZE = 4
// Cenário "respostas fora de ordem": a busca por Música chega depois da seguinte, para testar o descarte da resposta velha.
const OUT_OF_ORDER_SLOW_COLLECTION = 'music'
const OUT_OF_ORDER_EXTRA_MS = 1500
type NftDetail = Pick<NftInfo, 'id' | 'creator' | 'description' | 'details' | 'attributes' | 'rating' | 'reviews_count'>
const nftDetails = nftDetailsData as NftDetail[]

function buildNftInfo(nft: Nft): NftInfo | null {
  const detail = nftDetails.find((item) => item.id === nft.id)
  if (!detail) return null

  const networks = NETWORKS.filter(({ slug }) => nft.currency[slug] !== null).map(({ label }) => label)

  return {
    ...nft,
    ...detail,
    editions: getNftEditions(nft.id),
    token_id: getTokenId(nft),
    network_info: `Disponível em ${networks.join(', ')}, com procedência imutável e metadados armazenados no IPFS.`,
    contract_info: `0x7A${String(nft.id).padStart(2, '0')}...19E8 • Contrato inteligente ERC-721 verificado.`,
    royalties_info: `Direitos autorais de ${detail.creator}: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.`,
    gallery: range(GALLERY_SIZE).map(() => nft.url_img),
  }
}

function sortNfts(nfts: Nft[], sort: string | null) {
  if (sort === 'price-asc') nfts.sort((first, second) => new Big(first.currency.ethereum).cmp(second.currency.ethereum))
  if (sort === 'price-desc') nfts.sort((first, second) => new Big(second.currency.ethereum).cmp(first.currency.ethereum))
  if (sort === 'name') nfts.sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'))
}

function isPriceInRange(price: string, minPrice: string | null, maxPrice: string | null) {
  if (minPrice && Number(price) < Number(minPrice)) return false
  if (maxPrice && Number(price) > Number(maxPrice)) return false
  return true
}

function countFacets(nfts: Nft[]): CatalogFacets {
  const collections = {} as CatalogFacets['collections']
  COLLECTIONS.forEach(({ slug }) => {
    collections[slug] = nfts.filter((nft) => nft.collection === slug).length
  })

  const networks = {} as CatalogFacets['networks']
  NETWORKS.forEach(({ slug }) => {
    networks[slug] = nfts.filter((nft) => nft.currency[slug] !== null).length
  })

  const prices = nfts.map((nft) => Number(nft.currency.ethereum))
  const price = { min: Math.min(...prices).toFixed(2), max: Math.max(...prices).toFixed(2) }
  return { collections, networks, price }
}

export const handlers = [
  ...authHandlers,
  ...checkoutHandlers,
  ...accountHandlers,
  realtimeHandler,

  http.get('/api/list_nfts', async ({ request }) => {
    await networkDelay()
    const failure = readFailureResponse()
    if (failure) return failure

    const nfts = getNfts()
    const params = new URL(request.url).searchParams
    const search = params.get('search')?.toLowerCase()
    const collection = params.get('collection')
    if (getScenario().catalogOrder === 'out-of-order' && collection === OUT_OF_ORDER_SLOW_COLLECTION) {
      await delay(OUT_OF_ORDER_EXTRA_MS)
    }
    const network = params.get('network') as Network | null
    const minPrice = params.get('min_price')
    const maxPrice = params.get('max_price')
    const onlyTopNft = params.get('top_nft') === 'true'

    const filteredNfts = nfts.filter(
      (nft) =>
        (!search || nft.name.toLowerCase().includes(search)) &&
        (!collection || nft.collection === collection) &&
        (!network || nft.currency[network] !== null) &&
        (!onlyTopNft || nft.top_nft) &&
        isPriceInRange(nft.currency.ethereum, minPrice, maxPrice),
    )
    sortNfts(filteredNfts, params.get('sort'))

    const totalPages = Math.max(1, Math.ceil(filteredNfts.length / PAGE_SIZE))
    const page = Math.min(Math.max(1, Number(params.get('page')) || 1), totalPages)
    const start = (page - 1) * PAGE_SIZE

    const response: ListNftsResponse = {
      items: filteredNfts.slice(start, start + PAGE_SIZE),
      page,
      page_size: PAGE_SIZE,
      total: filteredNfts.length,
      total_pages: totalPages,
      facets: countFacets(nfts),
    }

    return HttpResponse.json(response)
  }),

  http.get('/api/nft_info/:id', async ({ params }) => {
    await networkDelay()
    const failure = readFailureResponse()
    if (failure) return failure

    const nft = getNfts().find((item) => item.id === Number(params.id))
    const nftInfo = nft && buildNftInfo(nft)
    if (!nftInfo) {
      return HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
    }

    return HttpResponse.json(nftInfo)
  }),

  http.get('/api/banners', async () => {
    await networkDelay()
    const failure = readFailureResponse()
    if (failure) return failure

    return HttpResponse.json(banners)
  }),
]
