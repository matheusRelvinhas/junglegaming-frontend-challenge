import { useQueries } from '@tanstack/react-query'
import { Breadcrumb } from '@/components/Breadcrumb'
import { NftRail } from '@/components/NftRail'
import { RAIL_SIZE } from '@/constants/catalog'
import { useCartNfts } from '@/hooks/useCartNfts'
import { listNftsQueryOptions } from '@/services/nfts'
import type { Nft } from '@/types/api'
import { unique } from '@/utils/array'
import { CartOverview } from './CartOverview'

function CollectorsAlsoViewed() {
  const { cartNftIds, cartNfts } = useCartNfts()
  const cartCollections = unique(cartNfts.map((nft) => nft.collection))

  const isCartEmpty = cartNftIds.length === 0
  const isWaitingForCart = !isCartEmpty && cartCollections.length === 0
  const searches = isCartEmpty ? [{}] : cartCollections.map((collection) => ({ collection }))
  const recommendationQueries = useQueries({
    queries: isWaitingForCart ? [] : searches.map((search) => listNftsQueryOptions(search)),
  })

  const recommendedNfts: Nft[] = []
  recommendationQueries.forEach((query) => {
    query.data?.items.forEach((nft) => {
      const isInCart = cartNftIds.includes(nft.id)
      const isAlreadyListed = recommendedNfts.some((listedNft) => listedNft.id === nft.id)
      if (!isInCart && !isAlreadyListed) recommendedNfts.push(nft)
    })
  })

  return (
    <NftRail
      title="Colecionadores também viram"
      nfts={recommendedNfts.slice(0, RAIL_SIZE)}
      isLoading={isWaitingForCart || recommendationQueries.some((query) => query.isPending)}
      isError={recommendationQueries.some((query) => query.isError)}
      emptyMessage="Ainda não temos recomendações para este carrinho."
    />
  )
}

export function CartPage() {
  return (
    <>
      <title>Carrinho | Kurio</title>
      <h1 className="sr-only">Carrinho de NFTs</h1>
      <Breadcrumb current="Carrinho" />
      <CartOverview />
      <CollectorsAlsoViewed />
    </>
  )
}
