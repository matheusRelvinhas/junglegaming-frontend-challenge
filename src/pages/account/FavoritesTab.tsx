import { Icon } from '@iconify/react'
import { Link } from '@tanstack/react-router'
import { NftCard, NftCardSkeleton } from '@/components/NftCard'
import { StateMessage } from '@/components/StateMessage'
import { CATALOG_SECTION_ID } from '@/constants/catalog'
import { ICONS } from '@/constants/icons'
import { useAppContext } from '@/context/AppContext'
import { useFavorites } from '@/services/account'
import { useNftInfos } from '@/services/nfts'
import { range } from '@/utils/array'

export function FavoritesTab() {
  const { sessionToken, favoriteIds, toggleFavorite, favoriteError } = useAppContext()
  const favorites = useFavorites(sessionToken)
  const nftQueries = useNftInfos(favoriteIds)

  if (favorites.isPending) {
    return (
      <ul className="grid grid-cols-2 gap-4 desktop:grid-cols-3 desktop:gap-6">
        {range(3).map((index) => (
          <li key={index}>
            <NftCardSkeleton />
          </li>
        ))}
      </ul>
    )
  }

  if (favoriteIds.length === 0) {
    return (
      <StateMessage
        icon={ICONS.heartOutline}
        title="Sua lista de interesse está vazia"
        description="Toque em Favoritar na página de um NFT para guardá-lo aqui."
        action={
          <Link to="/" hash={CATALOG_SECTION_ID}>
            Explorar NFTs
          </Link>
        }
      />
    )
  }

  return (
    <>
      <p role="alert" className="mb-4 text-sm text-destructive empty:hidden">
        {favoriteError}
      </p>
      <ul className="grid grid-cols-2 gap-4 desktop:grid-cols-3 desktop:gap-6">
        {nftQueries.map((query, index) => (
          <li key={favoriteIds[index]}>
            {query.data && <NftCard nft={query.data} />}
            {query.isPending && <NftCardSkeleton />}
            {query.isError && <p className="text-sand">Este NFT não está mais disponível.</p>}
            <button
              type="button"
              onClick={() => toggleFavorite(favoriteIds[index])}
              aria-label={`Remover ${query.data?.name ?? 'NFT'} da lista de interesse`}
              className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Icon icon={ICONS.heart} className="size-4" aria-hidden />
              Remover
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
