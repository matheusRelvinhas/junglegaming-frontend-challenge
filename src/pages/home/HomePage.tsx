import { Icon } from '@iconify/react'
import { useEffect, useState, type FocusEvent } from 'react'
import { Skeleton } from '@/components/Skeleton'
import { StateMessage } from '@/components/StateMessage'
import { CATALOG_SECTION_ID } from '@/constants/catalog'
import { ICONS } from '@/constants/icons'
import { useBanners } from '@/services/nfts'
import type { Banner } from '@/types/api'
import { NftCatalog } from './NftCatalog'

const ROTATION_INTERVAL_MS = 6000

function BannerSlide({ banner, isFirst }: { banner: Banner; isFirst: boolean }) {
  return (
    <div className="flex animate-banner-in items-center gap-4 overflow-hidden rounded-2xl bg-linear-to-br from-surface-3 to-surface-2 p-4 pb-8 desktop:grid desktop:grid-cols-[1fr_380px] desktop:gap-8 desktop:rounded-none desktop:bg-none desktop:p-0">
      <div className="flex-1 desktop:pt-11">
        <p className="text-xs font-semibold desktop:text-sm desktop:font-normal desktop:tracking-[0.14em]">Bem-vindo à Kurio</p>
        <h2 className="mt-2 text-base font-bold leading-7 tracking-[0.06em] desktop:mt-3.5 desktop:text-display desktop:leading-[70px]">
          {banner.title}
        </h2>
        <p className="mt-1.5 text-xs leading-[17px] text-sand desktop:mt-3 desktop:max-w-[560px] desktop:text-sm desktop:leading-6 desktop:tracking-[0.06em]">
          {banner.description}
        </p>
        <a
          href={`#${CATALOG_SECTION_ID}`}
          className="mt-3 inline-flex items-center gap-1.5 text-[0.6875rem] font-bold text-primary desktop:mt-8 desktop:h-10 desktop:w-[140px] desktop:justify-center desktop:rounded-sm desktop:bg-primary desktop:text-[0.9375rem] desktop:text-primary-foreground desktop:hover:brightness-110"
        >
          EXPLORAR
          <Icon icon={ICONS.arrowRight} className="size-3.5 desktop:hidden" aria-hidden />
        </a>
      </div>
      <img
        src={banner.img_url}
        alt=""
        width={380}
        height={380}
        fetchPriority={isFirst ? 'high' : 'low'}
        className="size-[138px] shrink-0 rounded-lg object-cover desktop:size-[380px] desktop:rounded-2xl"
      />
    </div>
  )
}

function HeaderMain() {
  const banners = useBanners()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const bannerCount = banners.data?.length ?? 0

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isPaused || prefersReducedMotion || bannerCount < 2) return

    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % bannerCount), ROTATION_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [isPaused, bannerCount])

  function resumeWhenFocusLeaves(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false)
  }

  if (banners.isPending) {
    return <Skeleton className="h-[180px] rounded-2xl desktop:h-[380px] desktop:rounded-none" />
  }
  if (banners.isError) {
    return <StateMessage icon={ICONS.offline} title="Não foi possível carregar os destaques" description={banners.error.message} onRetry={() => banners.refetch()} />
  }

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Destaques da Kurio"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={resumeWhenFocusLeaves}
      className="relative"
    >
      {banners.data.map((banner, index) => (
        <div
          key={banner.title}
          role="group"
          aria-roledescription="banner"
          aria-label={`${index + 1} de ${bannerCount}`}
          hidden={index !== activeIndex}
        >
          <BannerSlide banner={banner} isFirst={index === 0} />
        </div>
      ))}

      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 desktop:-bottom-10 desktop:left-[calc((100%-412px)/2)]">
        {banners.data.map((banner, index) => (
          <button
            key={banner.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Mostrar banner ${index + 1} de ${bannerCount}`}
            aria-current={index === activeIndex ? 'true' : undefined}
            className="group grid h-6 w-5 place-items-center"
          >
            <span className="h-2 w-2 rounded-full bg-primary/40 transition-all group-aria-[current=true]:w-4 group-aria-[current=true]:bg-primary" />
          </button>
        ))}
      </div>
    </section>
  )
}

export function HomePage() {
  return (
    <>
      <h1 className="sr-only">Kurio: marketplace de NFTs</h1>
      <HeaderMain />
      <NftCatalog />
    </>
  )
}
