import { useParams } from '@tanstack/react-router'
import { Breadcrumb } from '@/components/Breadcrumb'
import { NftRail } from '@/components/NftRail'
import { Skeleton } from '@/components/Skeleton'
import { StateMessage } from '@/components/StateMessage'
import { CATALOG_SECTION_ID, RAIL_SIZE } from '@/constants/catalog'
import { ICONS } from '@/constants/icons'
import { useListNfts, useNftInfo } from '@/services/nfts'
import type { CollectionSlug, NftInfo } from '@/types/api'
import { NotFoundPage } from '../NotFoundPage'
import { NftGallery } from './NftGallery'
import { NftPurchasePanel } from './NftPurchasePanel'

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

  return (
    <NftRail
      title="Mais desta coleção"
      nfts={otherNfts}
      isLoading={sameCollection.isPending}
      isError={sameCollection.isError}
      emptyMessage="Ainda não há outros NFTs nesta coleção."
    />
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
      <Breadcrumb />

      <div key={nft.id} className="grid gap-6 desktop:grid-cols-[480px_1fr] desktop:gap-[30px]">
        <NftGallery nft={nft} />
        <NftPurchasePanel nft={nft} />
      </div>

      <NftDetailsTabs nft={nft} />
      <CollectionRail collection={nft.collection} currentNftId={nft.id} />
    </>
  )
}
