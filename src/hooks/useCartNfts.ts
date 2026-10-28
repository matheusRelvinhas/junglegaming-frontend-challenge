import { useAppContext } from '@/context/AppContext'
import { useNftInfos } from '@/services/nfts'
import { unique } from '@/utils/array'

export function useCartNfts() {
  const { cartItems } = useAppContext()
  const cartNftIds = unique(cartItems.map((item) => item.nft_id))
  const nftQueries = useNftInfos(cartNftIds)
  const cartNfts = nftQueries.map((query) => query.data).filter((nft) => nft !== undefined)

  return { cartNftIds, nftQueries, cartNfts }
}
