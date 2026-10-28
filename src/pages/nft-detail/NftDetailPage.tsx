import { Link, useParams } from '@tanstack/react-router'
import { NftCard, NftCardSkeleton } from '@/components/NftCard'
import { Skeleton } from '@/components/Skeleton'
import { StateMessage } from '@/components/StateMessage'
import { CATALOG_SECTION_ID } from '@/constants/catalog'
import { ICONS } from '@/constants/icons'
import { useListNfts, useNftInfo } from '@/services/nfts'
import type { CollectionSlug, NftInfo } from '@/types/api'
import { NotFoundPage } from '../NotFoundPage'
import { NftGallery } from './NftGallery'
import { NftPurchasePanel } from './NftPurchasePanel'

const RAIL_SIZE = 5
const railListClass =
  '-mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2 desktop:mx-0 desktop:grid desktop:grid-cols-5 desktop:gap-[26px] desktop:overflow-visible desktop:px-0'
const railItemClass = 'w-[160px] shrink-0 snap-start desktop:w-auto'

function NftDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando NFT" className="grid gap-6 desktop:mt-12 desktop:grid-cols-[480px_1fr] desktop:gap-[30px]">
      <Skeleton className="aspect-square rounded-2xl desktop:ml-[100px] desktop:rounded-none" />
      <div>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-3 h-6 w-1/4" />
        <Skeleton className="mt-6 h-4" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <Skeleton className="mt-6 h-7 w-1/2" />
        <Skeleton className="mt-6 h-10 w-full" />
      </div>
    </div>
  )
}

function NftDetailsTabs({ nft }: { nft: NftInfo }) {
  const sections = [
    { title: 'Rede', text: nft.network_info },
    { title: 'Contrato', text: nft.contract_info },
    { title: 'Direitos autorais', text: nft.royalties_info },
  ]

  return (
    <section className="mt-10 desktop:mt-[70px]">
      <div role="tablist" aria-label="Informações do NFT" className="flex gap-6 overflow-x-auto border-b desktop:gap-10">
        <button
          type="button"
          role="tab"
          id="tab-details"
          aria-selected="true"
          aria-controls="panel-details"
          className="-mb-px shrink-0 border-b-[3px] border-primary pb-1.5 text-base font-bold text-primary desktop:text-lg"
        >
          Detalhes do NFT
        </button>
        <button type="button" role="tab" aria-selected="false" disabled title="Em breve" className="shrink-0 pb-1.5 text-base desktop:text-lg">
          Avaliações <span className="hidden desktop:inline">de colecionadores</span> ({nft.reviews_count})
        </button>
      </div>

      <div role="tabpanel" id="panel-details" aria-labelledby="tab-details" className="pt-3.5 leading-6 text-sand">
        {nft.details.map((paragraph) => (
          <p key={paragraph} className="mb-6">
            {paragraph}
          </p>
        ))}
        {sections.map((section) => (
          <div key={section.title} className="mt-2.5">
            <h3 className="font-bold text-foreground">{section.title}:</h3>
            <p>{section.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function CollectionRail({ collection, currentNftId }: { collection: CollectionSlug; currentNftId: number }) {
  const sameCollection = useListNfts({ collection })
  const otherNfts = sameCollection.data?.items.filter((nft) => nft.id !== currentNftId).slice(0, RAIL_SIZE) ?? []

  function renderContent() {
    if (sameCollection.isPending) {
      return (
        <ul aria-busy="true" aria-label="Carregando NFTs da coleção" className={railListClass}>
          {Array.from({ length: RAIL_SIZE }, (_, index) => (
            <li key={index} className={railItemClass}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      )
    }
    if (sameCollection.isError) return <p className="text-sand">Não foi possível carregar outros NFTs desta coleção.</p>
    if (otherNfts.length === 0) return <p className="text-sand">Ainda não há outros NFTs nesta coleção.</p>
    return (
      <ul className={railListClass}>
        {otherNfts.map((nft) => (
          <li key={nft.id} className={railItemClass}>
            <NftCard nft={nft} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section aria-labelledby="collection-rail-title" className="mt-16 desktop:mt-[100px]">
      <h2 id="collection-rail-title" className="mb-6 border-b pb-2 text-[1.0625rem] font-bold text-primary">
        Mais desta coleção
      </h2>
      {renderContent()}
    </section>
  )
}

export function NftDetailPage() {
  const { nftId } = useParams({ from: '/nft/$nftId' })
  const nftInfo = useNftInfo(Number(nftId))

  if (nftInfo.isPending) return <NftDetailSkeleton />

  if (nftInfo.isError) {
    if (nftInfo.error.status === 404) {
      return (
        <NotFoundPage
          title="NFT não encontrado"
          description="Este NFT não existe ou foi removido do mercado."
          linkLabel="Voltar para o mercado"
          hash={CATALOG_SECTION_ID}
        />
      )
    }
    return (
      <StateMessage
        icon={ICONS.offline}
        title="Não foi possível carregar o NFT"
        description={nftInfo.error.message}
        onRetry={() => nftInfo.refetch()}
      />
    )
  }

  const nft = nftInfo.data

  return (
    <>
      <title>{`${nft.name} | Kurio`}</title>
      <nav aria-label="Trilha de navegação" className="mb-2 hidden text-[0.9375rem] font-semibold desktop:block">
        <Link to="/" className="hover:text-primary">
          Início
        </Link>
        {' / '}
        <Link to="/" hash={CATALOG_SECTION_ID} className="hover:text-primary">
          Mercado
        </Link>
      </nav>

      <div key={nft.id} className="grid gap-6 desktop:grid-cols-[480px_1fr] desktop:gap-[30px]">
        <NftGallery nft={nft} />
        <NftPurchasePanel nft={nft} />
      </div>

      <NftDetailsTabs nft={nft} />
      <CollectionRail collection={nft.collection} currentNftId={nft.id} />
    </>
  )
}
