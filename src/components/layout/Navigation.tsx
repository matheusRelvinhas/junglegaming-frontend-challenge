import { Icon } from '@iconify/react'
import { Link, useCanGoBack, useLocation, useMatches, useNavigate, useRouter } from '@tanstack/react-router'
import { CATALOG_SECTION_ID, FILTER_DIALOG_ID, SEARCH_INPUT_ID } from '@/constants/catalog'
import { ICONS } from '@/constants/icons'
import { useAppContext } from '@/context/AppContext'
import { useAuthModal } from '@/hooks/useAuthModal'
import { Skeleton } from '../Skeleton'

const navLinkClass =
  'relative flex h-full items-center text-base after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-primary after:opacity-0 hover:text-primary aria-[current=page]:font-semibold aria-[current=page]:text-primary aria-[current=page]:after:opacity-100'
const exactMatch = { exact: true, includeSearch: false, includeHash: true }

function SearchInput() {
  const { search, setSearch } = useAppContext()

  return (
    <form
      role="search"
      onSubmit={(event) => event.preventDefault()}
      className="flex h-[46px] flex-1 items-center gap-2 rounded-md bg-surface px-3 focus-within:outline-2 focus-within:outline-ring desktop:h-10 desktop:w-[200px] desktop:flex-none"
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

function SignOutButton({ className }: { className: string }) {
  const { signOut } = useAppContext()

  return (
    <button type="button" onClick={signOut} className={`flex items-center gap-2 rounded-sm border border-primary text-primary ${className}`}>
      <Icon icon={ICONS.logout} className="size-5" aria-hidden />
      Sair
    </button>
  )
}

function DesktopAccount() {
  const { user, isCheckingSession } = useAppContext()
  const { openAuth } = useAuthModal()

  if (isCheckingSession) return <Skeleton className="h-[35px] w-[100px] rounded-sm" />

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openAuth('login')}
        className="flex h-[35px] items-center gap-2 rounded-sm bg-primary px-3 text-[0.9375rem] font-medium text-primary-foreground hover:brightness-110"
      >
        <Icon icon={ICONS.login} className="size-5" aria-hidden />
        Entrar
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Link to="/account" title={`Meu perfil (${user.name})`} className="flex items-center gap-1 text-sm text-sand hover:text-primary">
        Olá,
        <b className="w-[72px] truncate text-foreground">{user.name.split(' ')[0]}</b>
      </Link>
      <SignOutButton className="h-[35px] px-3 text-[0.9375rem] hover:bg-primary/10" />
    </div>
  )
}

function MobileAccount() {
  const { user } = useAppContext()
  const { openAuth } = useAuthModal()

  if (!user) {
    return (
      <button type="button" onClick={() => openAuth('login')} aria-label="Entrar" className="grid size-11 place-items-center">
        <Icon icon={ICONS.user} className="size-6" aria-hidden />
      </button>
    )
  }

  return (
    <>
      <button
        type="button"
        popoverTarget="account-menu"
        aria-label={`Conta de ${user.name}`}
        className="grid size-11 place-items-center text-primary"
      >
        <Icon icon={ICONS.user} className="size-6" aria-hidden />
      </button>
      <div
        id="account-menu"
        popover="auto"
        className="fixed inset-auto right-4 bottom-24 m-0 w-60 rounded-xl border bg-surface p-4 text-foreground"
      >
        <p className="font-bold">{user.name}</p>
        <p title={user.email} className="truncate text-xs text-gray">
          {user.email}
        </p>
        <Link
          to="/account"
          onClick={() => document.getElementById('account-menu')?.hidePopover()}
          className="mt-4 flex h-10 items-center justify-center gap-2 rounded-sm bg-primary font-bold text-primary-foreground"
        >
          <Icon icon={ICONS.userOutline} className="size-5" aria-hidden />
          Meu perfil
        </Link>
        <SignOutButton className="mt-2 h-10 w-full justify-center" />
      </div>
    </>
  )
}

function CartLink({ icon, className = '' }: { icon: string; className?: string }) {
  const { cartCount } = useAppContext()

  return (
    <Link to="/cart" aria-label={`Carrinho com ${cartCount} itens`} className={`hover:text-primary ${className}`}>
      <span className="relative block">
        <Icon icon={icon} className="size-6" aria-hidden />
        {cartCount > 0 && (
          <span
            aria-hidden
            className="absolute -top-1.5 -right-2.5 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-primary px-1 text-[0.5625rem] font-bold text-primary-foreground"
          >
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </span>
    </Link>
  )
}

export function DesktopHeader() {
  const isMarketPage = useMatches({ select: (matches) => matches.at(-1)?.staticData.isMarketPage ?? false })

  return (
    <header className="container mx-auto flex h-[75px] items-center justify-between border-b px-6">
      <Link to="/" className="text-[0.8125rem] font-bold tracking-[0.14em]">
        KURIO
      </Link>

      <nav aria-label="Principal" className="flex h-full gap-7">
        <Link to="/" activeOptions={exactMatch} className={navLinkClass}>
          Início
        </Link>
        <Link
          to="/"
          hash={CATALOG_SECTION_ID}
          activeOptions={exactMatch}
          aria-current={isMarketPage ? 'page' : undefined}
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

      <div className="flex items-center gap-5">
        <SearchInput />
        <CartLink icon={ICONS.cart} />
        <DesktopAccount />
      </div>
    </header>
  )
}

export function MobileTopBar() {
  const { setIsFilterOpen } = useAppContext()
  const isHome = useLocation({ select: (location) => location.pathname === '/' })
  const pageTitle = useMatches({ select: (matches) => matches.at(-1)?.staticData.title })
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
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={goBack}
            aria-label="Voltar"
            className="grid size-9 shrink-0 place-items-center rounded-full border bg-surface text-sand"
          >
            <Icon icon={ICONS.chevronLeft} className="size-5" aria-hidden />
          </button>
          {pageTitle && (
            <p aria-hidden className="flex-1 pr-9 text-center text-lg font-bold">
              {pageTitle}
            </p>
          )}
        </div>
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
      <Link
        to="/account"
        search={{ tab: 'favorites' }}
        aria-label="Lista de interesse"
        className="grid size-11 place-items-center aria-[current=page]:text-primary"
      >
        <Icon icon={ICONS.heart} className="size-6" aria-hidden />
      </Link>
      <button
        type="button"
        onClick={focusSearch}
        aria-label="Buscar NFTs"
        className="-mt-14 grid size-16 place-items-center rounded-full bg-primary text-foreground shadow-[0_0_0_10px_var(--color-background)]"
      >
        <Icon icon={ICONS.scan} className="size-7" aria-hidden />
      </button>
      <CartLink icon={ICONS.cartSolid} className="grid size-11 place-items-center aria-[current=page]:text-primary" />
      <MobileAccount />
    </nav>
  )
}
