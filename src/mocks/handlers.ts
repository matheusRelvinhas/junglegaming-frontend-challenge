import { delay, http, HttpResponse } from 'msw'
import { COLLECTIONS, NETWORKS } from '@/constants/catalog'
import type { CatalogFacets, ListNftsResponse, Network, Nft, NftInfo } from '@/types/api'
import nftDetailsData from './data/nft-details.json'
import nftsData from './data/nfts.json'

const PAGE_SIZE = 9
const GALLERY_SIZE = 4
const nfts = nftsData as Nft[]
type NftDetail = Pick<
  NftInfo,
  'id' | 'creator' | 'description' | 'details' | 'attributes' | 'rating' | 'reviews_count' | 'editions'
>
const nftDetails = nftDetailsData as NftDetail[]

function buildNftInfo(nft: Nft): NftInfo | null {
  const detail = nftDetails.find((item) => item.id === nft.id)
  if (!detail) return null

  const networks = NETWORKS.filter(({ slug }) => nft.currency[slug] !== null).map(({ label }) => label)

  return {
    ...nft,
    ...detail,
    token_id: `#${nft.name.split('#')[1].padStart(4, '0')}`,
    network_info: `Disponível em ${networks.join(', ')}, com procedência imutável e metadados armazenados no IPFS.`,
    contract_info: `0x7A${String(nft.id).padStart(2, '0')}...19E8 • Contrato inteligente ERC-721 verificado.`,
    royalties_info: `Direitos autorais de ${detail.creator}: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.`,
    gallery: Array.from({ length: GALLERY_SIZE }, () => nft.url_img),
  }
}

function isPriceInRange(price: string, minPrice: string | null, maxPrice: string | null) {
  if (minPrice && Number(price) < Number(minPrice)) return false
  if (maxPrice && Number(price) > Number(maxPrice)) return false
  return true
}

const catalogFacets = countFacets()

function countFacets(): CatalogFacets {
  const collections = Object.fromEntries(
    COLLECTIONS.map(({ slug }) => [slug, nfts.filter((nft) => nft.collection === slug).length]),
  ) as CatalogFacets['collections']
  const networks = Object.fromEntries(
    NETWORKS.map(({ slug }) => [slug, nfts.filter((nft) => nft.currency[slug] !== null).length]),
  ) as CatalogFacets['networks']
  const prices = nfts.map((nft) => Number(nft.currency.ethereum))
  const price = { min: Math.min(...prices).toFixed(2), max: Math.max(...prices).toFixed(2) }
  return { collections, networks, price }
}

export const handlers = [
  http.get('/api/list_nfts', async ({ request }) => {
    await delay()

    const params = new URL(request.url).searchParams
    const search = params.get('search')?.toLowerCase()
    const collection = params.get('collection')
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

    const totalPages = Math.max(1, Math.ceil(filteredNfts.length / PAGE_SIZE))
    const page = Math.min(Math.max(1, Number(params.get('page')) || 1), totalPages)
    const start = (page - 1) * PAGE_SIZE

    const response: ListNftsResponse = {
      items: filteredNfts.slice(start, start + PAGE_SIZE),
      page,
      page_size: PAGE_SIZE,
      total: filteredNfts.length,
      total_pages: totalPages,
      facets: catalogFacets,
    }

    return HttpResponse.json(response)
  }),

  http.get('/api/nft_info/:id', async ({ params }) => {
    await delay()

    const nft = nfts.find((item) => item.id === Number(params.id))
    const nftInfo = nft && buildNftInfo(nft)
    if (!nftInfo) {
      return HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
    }

    return HttpResponse.json(nftInfo)
  }),
]
