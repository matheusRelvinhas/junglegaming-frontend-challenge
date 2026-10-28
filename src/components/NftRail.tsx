import { RAIL_SIZE } from '@/constants/catalog'
import type { Nft } from '@/types/api'
import { range } from '@/utils/array'
import { NftCard, NftCardSkeleton } from './NftCard'

const listClass =
  '-mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2 desktop:mx-0 desktop:grid desktop:grid-cols-5 desktop:gap-[26px] desktop:overflow-visible desktop:px-0'
const itemClass = 'w-[160px] shrink-0 snap-start desktop:w-auto'

type NftRailProps = {
  title: string
  nfts: Nft[]
  isLoading: boolean
  isError: boolean
  emptyMessage: string
}

export function NftRail({ title, nfts, isLoading, isError, emptyMessage }: NftRailProps) {
  const titleId = `rail-${title.toLowerCase().replaceAll(' ', '-')}`

  function renderContent() {
    if (isLoading) {
      return (
        <ul aria-busy="true" aria-label={`Carregando: ${title}`} className={listClass}>
          {range(RAIL_SIZE).map((placeholder) => (
            <li key={placeholder} className={itemClass}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      )
    }
    if (isError) return <p className="text-sand">Não foi possível carregar estes NFTs.</p>
    if (nfts.length === 0) return <p className="text-sand">{emptyMessage}</p>
    return (
      <ul className={listClass}>
        {nfts.map((nft) => (
          <li key={nft.id} className={itemClass}>
            <NftCard nft={nft} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section aria-labelledby={titleId} className="mt-16 desktop:mt-[100px]">
      <h2 id={titleId} className="mb-6 border-b pb-2 text-[1.0625rem] font-bold text-primary">
        {title}
      </h2>
      {renderContent()}
    </section>
  )
}
