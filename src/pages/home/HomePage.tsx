import { Icon } from '@iconify/react'
import { CATALOG_SECTION_ID } from '@/constants/catalog'
import { ICONS } from '@/constants/icons'
import { NftCatalog } from './NftCatalog'

function HeaderMain() {
  return (
    <section
      aria-labelledby="hero-title"
      className="flex items-center gap-4 overflow-hidden rounded-2xl bg-linear-to-br from-surface-3 to-surface-2 p-4 desktop:grid desktop:grid-cols-[1fr_380px] desktop:gap-8 desktop:rounded-none desktop:bg-none desktop:p-0"
    >
      <div className="flex-1 desktop:pt-11">
        <p className="text-xs font-semibold desktop:text-sm desktop:font-normal desktop:tracking-[0.14em]">
          Bem-vindo à Kurio
        </p>
        <h1
          id="hero-title"
          className="mt-2 text-base font-bold leading-7 tracking-[0.06em] desktop:mt-3.5 desktop:text-display desktop:leading-[70px]"
        >
          SEJA DONO DO FUTURO <br className="hidden desktop:block" />
          DA ARTE DIGITAL
        </h1>
        <p className="mt-1.5 text-xs leading-[17px] text-sand desktop:mt-3 desktop:max-w-[560px] desktop:text-sm desktop:leading-6 desktop:tracking-[0.06em]">
          Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara,
          apoie artistas e tenha uma parte da cultura da internet.
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
        src="/nfts/emerald-ape.png"
        alt="Emerald Ape #042: macaco de óculos redondos e jaqueta verde"
        width={380}
        height={380}
        fetchPriority="high"
        className="size-[138px] shrink-0 rounded-lg object-cover desktop:size-[380px] desktop:rounded-2xl"
      />
    </section>
  )
}

export function HomePage() {
  return (
    <>
      <HeaderMain />
      <NftCatalog />
    </>
  )
}
