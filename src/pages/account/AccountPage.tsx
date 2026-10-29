import { Icon } from '@iconify/react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { LoginRequired } from '@/components/LoginRequired'
import { Skeleton } from '@/components/Skeleton'
import { ACCOUNT_MENU, type AccountTab } from '@/constants/account'
import { ICONS } from '@/constants/icons'
import { useAppContext } from '@/context/AppContext'
import { useProfile } from '@/services/account'
import type { User } from '@/types/api'
import { ActivityTab } from './ActivityTab'
import { FavoritesTab } from './FavoritesTab'
import { ProfileTab } from './ProfileTab'
import { WalletsTab } from './WalletsTab'

const menuItemClass =
  'flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm whitespace-nowrap text-primary desktop:gap-3 desktop:rounded-none desktop:border-0 desktop:border-l-[6px] desktop:border-transparent desktop:px-4 desktop:py-3 desktop:text-[0.9375rem]'
const activeItemClass =
  'aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground desktop:aria-[current=page]:bg-transparent desktop:aria-[current=page]:text-primary'

function AccountMenu({ activeTab }: { activeTab: AccountTab }) {
  const { signOut } = useAppContext()
  const navigate = useNavigate()

  function leaveAccount() {
    signOut()
    navigate({ to: '/' })
  }

  return (
    <nav aria-labelledby="account-menu-title" className="min-w-0 desktop:bg-surface desktop:pt-3.5 desktop:pb-3">
      <h2 id="account-menu-title" className="sr-only desktop:not-sr-only desktop:mx-2.5 desktop:mb-2 desktop:block desktop:text-h3">
        Meu perfil
      </h2>
      <ul className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2 [scrollbar-width:none] desktop:mx-0 desktop:block desktop:px-0 desktop:pb-0">
        {ACCOUNT_MENU.map((item) => (
          <li key={item.label} className="shrink-0">
            {item.tab ? (
              <Link
                to="/account"
                search={{ tab: item.tab }}
                aria-current={item.tab === activeTab ? 'page' : undefined}
                className={`${menuItemClass} ${activeItemClass} hover:bg-primary/5`}
              >
                <Icon icon={item.icon} className="size-[18px]" aria-hidden />
                {item.label}
              </Link>
            ) : (
              <span aria-disabled="true" title="Em breve" className={`${menuItemClass} opacity-40`}>
                <Icon icon={item.icon} className="size-[18px]" aria-hidden />
                {item.label}
              </span>
            )}
          </li>
        ))}
        <li className="shrink-0 desktop:mt-1.5 desktop:border-t">
          <button type="button" onClick={leaveAccount} className={`${menuItemClass} w-full font-bold hover:bg-primary/5`}>
            <Icon icon={ICONS.logout} className="size-[18px]" aria-hidden />
            Sair
          </button>
        </li>
      </ul>
    </nav>
  )
}

const TAB_CONTENT: Record<AccountTab, { title: string; content: ReactNode }> = {
  profile: { title: 'Perfil do colecionador', content: <ProfileTab /> },
  wallets: { title: 'Carteiras', content: <WalletsTab /> },
  activity: { title: 'Atividade', content: <ActivityTab /> },
  favorites: { title: 'Lista de interesse', content: <FavoritesTab /> },
}

function MobileAccountSummary({ user }: { user: User }) {
  const { sessionToken } = useAppContext()
  const avatarUrl = useProfile(sessionToken).data?.avatar_url

  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface p-4 desktop:hidden">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" width={48} height={48} className="size-12 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-3 text-primary">
          <Icon icon={ICONS.userOutline} className="size-6" aria-hidden />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-bold">{user.name}</p>
        <p className="truncate text-xs text-gray">{user.email}</p>
      </div>
    </div>
  )
}

export function AccountPage() {
  const { user, isCheckingSession } = useAppContext()
  const activeTab = useSearch({ strict: false, select: (search) => search.tab }) ?? 'profile'
  const tab = TAB_CONTENT[activeTab]

  return (
    <>
      <title>{`${tab.title} | Kurio`}</title>
      <h1 className="sr-only">Meu perfil</h1>
      {isCheckingSession && <Skeleton className="h-[600px]" />}
      {!isCheckingSession && !user && <LoginRequired title="Entre para ver seu perfil" />}
      {user && (
        <div className="grid grid-cols-1 gap-5 pb-10 desktop:grid-cols-[310px_1fr] desktop:items-start desktop:gap-7 desktop:pt-6 desktop:pb-16">
          <div className="grid min-w-0 gap-4">
            <MobileAccountSummary user={user} />
            <AccountMenu activeTab={activeTab} />
          </div>
          <section aria-labelledby="account-tab-title" className="min-w-0">
            <h2 id="account-tab-title" className="mb-6 text-base font-bold">
              {tab.title}
            </h2>
            {tab.content}
          </section>
        </div>
      )}
    </>
  )
}
