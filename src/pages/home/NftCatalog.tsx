import { Icon } from '@iconify/react'
import { Link } from '@tanstack/react-router'
import { NftCard, NftCardSkeleton } from '@/components/NftCard'
import { Skeleton } from '@/components/Skeleton'
import { StateMessage } from '@/components/StateMessage'
import { CATALOG_SECTION_ID } from '@/constants/catalog'
import { ICONS } from '@/constants/icons'
import { useAppContext } from '@/context/AppContext'
import { useCatalogSearch } from '@/hooks/useCatalogSearch'
import { useListNfts } from '@/services/nfts'
import type { Nft } from '@/types/api'
import { FilterDialog, FilterPanel } from './FilterPanel'

const SKELETON_CARDS = 9
const gridClass =
  'grid grid-cols-2 gap-x-4 gap-y-5 pb-8 desktop:grid-cols-3 desktop:gap-x-[34px] desktop:gap-y-16 desktop:pb-0'
const staggeredItemClass = 'even:translate-y-8 desktop:even:translate-y-0'
const pageButtonClass = 'grid size-[35px] place-items-center rounded-[2px] border text-lg hover:border-primary'

function FeaturedNft({ nft, isLoading }: { nft?: Nft; isLoading: boolean }) {
  if (isLoading) return <Skeleton className="h-[152px] rounded-xl desktop:h-[440px] desktop:rounded-none" />
  if (!nft) return null

  return (
    <article aria-labelledby="featured-title">
      <Link
        to="/nft/$nftId"
        params={{ nftId: String(nft.id) }}
        className="group flex items-center gap-4 rounded-xl bg-linear-to-b from-surface to-background p-4 desktop:flex-col desktop:items-stretch desktop:gap-0 desktop:rounded-none desktop:p-0 desktop:text-center"
      >
        <img
          src={nft.url_img}
          alt={nft.name}
          width={310}
          height={310}
          loading="lazy"
          className="size-[120px] shrink-0 rounded-xl object-cover desktop:order-last desktop:mt-2.5 desktop:size-auto desktop:w-full"
        />
        <div className="desktop:contents">
          <h2
            id="featured-title"
            className="text-base font-bold text-primary desktop:px-5 desktop:pt-6 desktop:text-left desktop:text-[1.375rem]"
          >
            NFT EM DESTAQUE
          </h2>
          <p className="text-sm font-bold desktop:mt-1 desktop:text-xl">OFERTA LIMITADA</p>
          <p className="mt-2 text-sm group-hover:text-primary desktop:hidden">{nft.name}</p>
          <p className="text-sm font-bold text-primary desktop:hidden">{nft.currency.ethereum} ETH</p>
        </div>
      </Link>
    </article>
  )
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação" className="mt-16 flex justify-center gap-2 desktop:mt-[86px] desktop:justify-end">
      {page > 1 && (
        <button type="button" aria-label="Página anterior" onClick={() => onPageChange(page - 1)} className={pageButtonClass}>
          <Icon icon={ICONS.chevronLeft} className="size-5" aria-hidden />
        </button>
      )}
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
        <button
          key={pageNumber}
          type="button"
          aria-label={`Página ${pageNumber}`}
          aria-current={pageNumber === page ? 'page' : undefined}
          onClick={() => onPageChange(pageNumber)}
          className={`${pageButtonClass} aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:font-medium aria-[current=page]:text-primary-foreground`}
        >
          {pageNumber}
        </button>
      ))}
      {page < totalPages && (
        <button type="button" aria-label="Próxima página" onClick={() => onPageChange(page + 1)} className={pageButtonClass}>
          <Icon icon={ICONS.chevronRight} className="size-5" aria-hidden />
        </button>
      )}
    </nav>
  )
}

export function NftCatalog() {
  const { isMobile } = useAppContext()
  const { filters, updateCatalogSearch, clearCatalogSearch } = useCatalogSearch()

  const catalog = useListNfts(filters)
  const featured = useListNfts({ top_nft: true })
  const facets = catalog.data?.facets

  function goToPage(page: number) {
    updateCatalogSearch({ page: page > 1 ? page : undefined })
    document.getElementById(CATALOG_SECTION_ID)?.scrollIntoView()
  }

  function renderResults() {
    if (catalog.isPending) {
      return (
        <ul aria-busy="true" aria-label="Carregando NFTs" className={gridClass}>
          {Array.from({ length: SKELETON_CARDS }, (_, index) => (
            <li key={index} className={staggeredItemClass}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      )
    }

    if (catalog.isError) {
      return (
        <StateMessage
          icon={ICONS.offline}
          title="Não foi possível carregar os NFTs"
          description={catalog.error.message}
          onRetry={() => catalog.refetch()}
        />
      )
    }

    if (catalog.data.items.length === 0) {
      return (
        <StateMessage
          icon={ICONS.search}
          title="Nenhum NFT encontrado"
          description="Ajuste a busca ou os filtros para ver outros resultados."
          action={
            <button type="button" onClick={clearCatalogSearch}>
              Limpar filtros
            </button>
          }
        />
      )
    }

    return (
      <>
        <ul className={gridClass}>
          {catalog.data.items.map((nft) => (
            <li key={nft.id} className={staggeredItemClass}>
              <NftCard nft={nft} />
            </li>
          ))}
        </ul>
        <Pagination page={catalog.data.page} totalPages={catalog.data.total_pages} onPageChange={goToPage} />
      </>
    )
  }

  return (
    <section
      id={CATALOG_SECTION_ID}
      aria-labelledby="catalog-title"
      className="mt-6 grid scroll-mt-24 gap-6 desktop:mt-24 desktop:grid-cols-[310px_1fr] desktop:items-start desktop:gap-12"
    >
      <aside className="flex flex-col gap-6" aria-label="Filtros e destaque">
        {isMobile ? <FilterDialog facets={facets} total={catalog.data?.total} /> : <FilterPanel facets={facets} />}
        <FeaturedNft nft={featured.data?.items[0]} isLoading={featured.isPending} />
      </aside>

      <div>
        <div className="mb-4 flex items-center justify-between desktop:mb-8">
          <h2 id="catalog-title" className="border-b-2 border-primary pb-1 text-[0.9375rem] font-semibold text-primary">
            Todos os NFTs
          </h2>
          <p role="status" className="text-xs text-khaki">
            {catalog.isFetching ? 'Atualizando…' : catalog.data && `${catalog.data.total} NFTs`}
          </p>
        </div>
        {renderResults()}
      </div>
    </section>
  )
}
