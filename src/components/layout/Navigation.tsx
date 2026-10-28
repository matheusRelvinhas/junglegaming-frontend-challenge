import { Icon } from '@iconify/react'
import { Link, useCanGoBack, useLocation, useNavigate, useRouter } from '@tanstack/react-router'
import { CATALOG_SECTION_ID, FILTER_DIALOG_ID, SEARCH_INPUT_ID } from '@/constants/catalog'
import { ICONS } from '@/constants/icons'
import { useAppContext } from '@/context/AppContext'

const navLinkClass =
  'relative flex h-full items-center text-base after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-primary after:opacity-0 hover:text-primary aria-[current=page]:font-semibold aria-[current=page]:text-primary aria-[current=page]:after:opacity-100'
const exactMatch = { exact: true, includeSearch: false, includeHash: true }
const comingSoonClass = 'grid size-11 place-items-center disabled:opacity-40'

function SearchInput() {
  const { search, setSearch } = useAppContext()

  return (
    <form
      role="search"
      onSubmit={(event) => event.preventDefault()}
      className="flex h-[46px] flex-1 items-center gap-2 rounded-md bg-surface px-3 focus-within:outline-2 focus-within:outline-ring desktop:h-10 desktop:w-[260px] desktop:flex-none"
    >
      <Icon icon={ICONS.search} className="size-5 shrink-0 text-khaki" aria-hidden />
      <label htmlFor={SEARCH_INPUT_ID} className="sr-only">
        Buscar NFTs pelo nome
      </label>
      <input
        id={SEARCH_INPUT_ID}
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Explorar coleções"
        autoComplete="off"
        className="w-full bg-transparent text-[0.9375rem] outline-none"
      />
    </form>
  )
}

function CartButton({ icon, className = '' }: { icon: string; className?: string }) {
  const { cartCount } = useAppContext()

  return (
    <button
      type="button"
      disabled
      title="Em breve"
      aria-label={`Carrinho com ${cartCount} itens (página em breve)`}
      className={className}
    >
      <span className="relative block">
        <Icon icon={icon} className="size-6 opacity-60" aria-hidden />
        {cartCount > 0 && (
          <span
            aria-hidden
            className="absolute -top-1.5 -right-2.5 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-primary px-1 text-[0.5625rem] font-bold text-primary-foreground"
          >
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </span>
    </button>
  )
}

export function DesktopHeader() {
  const isNftDetail = useLocation({ select: (location) => location.pathname.startsWith('/nft/') })

  return (
    <header className="container mx-auto flex h-[75px] items-center justify-between border-b px-6">
      <Link to="/" className="text-[0.8125rem] font-bold tracking-[0.14em]">
        KURIO
      </Link>

      <nav aria-label="Principal" className="flex h-full gap-10">
        <Link to="/" activeOptions={exactMatch} className={navLinkClass}>
          Início
        </Link>
        <Link
          to="/"
          hash={CATALOG_SECTION_ID}
          activeOptions={exactMatch}
          aria-current={isNftDetail ? 'page' : undefined}
          className={navLinkClass}
        >
          Mercado
        </Link>
        {['Criadores', 'Aprenda'].map((label) => (
          <span key={label} aria-disabled="true" title="Em breve" className="flex items-center text-base opacity-40">
            {label}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-6">
        <SearchInput />
        <CartButton icon={ICONS.cart} />
        <button
          type="button"
          disabled
          title="Em breve"
          className="flex h-[35px] items-center gap-2 rounded-sm bg-primary px-3 text-[0.9375rem] font-medium text-primary-foreground disabled:opacity-60"
        >
          <Icon icon={ICONS.login} className="size-5" aria-hidden />
          Entrar
        </button>
      </div>
    </header>
  )
}

export function MobileTopBar() {
  const { setIsFilterOpen } = useAppContext()
  const isHome = useLocation({ select: (location) => location.pathname === '/' })
  const router = useRouter()
  const canGoBack = useCanGoBack()

  function goBack() {
    if (canGoBack) router.history.back()
    else router.navigate({ to: '/' })
  }

  return (
    <header className="sticky top-0 z-30 bg-background px-6 pt-5 pb-3">
      {isHome ? (
        <div className="flex gap-2">
          <SearchInput />
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            aria-haspopup="dialog"
            aria-controls={FILTER_DIALOG_ID}
            aria-label="Abrir filtros"
            className="grid size-[46px] shrink-0 place-items-center rounded-[10px] bg-primary text-primary-foreground"
          >
            <Icon icon={ICONS.filter} className="size-6" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={goBack}
          aria-label="Voltar"
          className="grid size-9 place-items-center rounded-full border bg-surface text-sand"
        >
          <Icon icon={ICONS.chevronLeft} className="size-5" aria-hidden />
        </button>
      )}
    </header>
  )
}

export function MobileTabBar() {
  const navigate = useNavigate()

  function focusSearch() {
    const searchInput = document.getElementById(SEARCH_INPUT_ID)
    if (searchInput) searchInput.focus()
    else navigate({ to: '/' })
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="sticky bottom-0 z-30 flex h-20 items-center justify-around rounded-t-[32px] bg-surface text-sand"
    >
      <Link
        to="/"
        aria-label="Início"
        activeOptions={{ exact: true, includeSearch: false }}
        className="grid size-11 place-items-center aria-[current=page]:text-primary"
      >
        <Icon icon={ICONS.home} className="size-6" aria-hidden />
      </Link>
      <button type="button" disabled aria-label="Favoritos (em breve)" className={comingSoonClass}>
        <Icon icon={ICONS.heart} className="size-6" aria-hidden />
      </button>
      <button
        type="button"
        onClick={focusSearch}
        aria-label="Buscar NFTs"
        className="-mt-14 grid size-16 place-items-center rounded-full bg-primary text-foreground shadow-[0_0_0_10px_var(--color-background)]"
      >
        <Icon icon={ICONS.scan} className="size-7" aria-hidden />
      </button>
      <CartButton icon={ICONS.cartSolid} className="grid size-11 place-items-center" />
      <button type="button" disabled aria-label="Perfil (em breve)" className={comingSoonClass}>
        <Icon icon={ICONS.user} className="size-6" aria-hidden />
      </button>
    </nav>
  )
}
