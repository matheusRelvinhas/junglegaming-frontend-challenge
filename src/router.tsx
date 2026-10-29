import { createRootRoute, createRoute, createRouter, lazyRouteComponent, Outlet, type ErrorComponentProps } from '@tanstack/react-router'
import { Layout } from '@/app/layout'
import { StateMessage } from '@/components/StateMessage'
import { ACCOUNT_MENU, type AccountTab } from '@/constants/account'
import { COLLECTIONS, NETWORKS, SORT_OPTIONS } from '@/constants/catalog'
import { ICONS } from '@/constants/icons'
import { AppProvider } from '@/context/AppProvider'
import type { AuthMode } from '@/hooks/useAuthModal'
import { HomePage } from '@/pages/home/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import type { ListNftsParams } from '@/types/api'

function toText(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined
}

function toPrice(value: unknown) {
  const price = Number(value)
  return value !== undefined && Number.isFinite(price) && price >= 0 ? price : undefined
}

function toPage(value: unknown) {
  const page = Number(value)
  return Number.isInteger(page) && page > 1 ? page : undefined
}

function parseHomeSearch(search: Record<string, unknown>): ListNftsParams {
  const collection = COLLECTIONS.find((item) => item.slug === search.collection)
  const network = NETWORKS.find((item) => item.slug === search.network)
  const sort = SORT_OPTIONS.find((item) => item.value !== 'recent' && item.value === search.sort)

  return {
    search: toText(search.search) || undefined,
    sort: sort?.value,
    collection: collection?.slug,
    network: network?.slug,
    min_price: toPrice(search.min_price),
    max_price: toPrice(search.max_price),
    page: toPage(search.page),
  }
}

// Só caminhos internos ("/checkout"), nunca outro site ("//site.com", "https://...").
function toInternalPath(value: unknown) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : undefined
}

function parseRootSearch(search: Record<string, unknown>): { auth?: AuthMode; redirect?: string } {
  const auth = search.auth
  return {
    auth: auth === 'login' || auth === 'signup' ? auth : undefined,
    redirect: toInternalPath(search.redirect),
  }
}

function parseCheckoutSearch(search: Record<string, unknown>): { order?: string } {
  return { order: toText(search.order) || undefined }
}

function parseAccountSearch(search: Record<string, unknown>): { tab?: AccountTab } {
  const menuItem = ACCOUNT_MENU.find((item) => item.tab !== undefined && item.tab === search.tab)
  return { tab: menuItem?.tab }
}

const rootRoute = createRootRoute({
  validateSearch: parseRootSearch,
  component: () => (
    <AppProvider>
      <Layout>
        <Outlet />
      </Layout>
    </AppProvider>
  ),
  notFoundComponent: () => <NotFoundPage />,
})

const NftDetailPage = lazyRouteComponent(() => import('@/pages/nft-detail/NftDetailPage'), 'NftDetailPage')
const CartPage = lazyRouteComponent(() => import('@/pages/cart/CartPage'), 'CartPage')
const CheckoutPage = lazyRouteComponent(() => import('@/pages/checkout/CheckoutPage'), 'CheckoutPage')
const AccountPage = lazyRouteComponent(() => import('@/pages/account/AccountPage'), 'AccountPage')

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: parseHomeSearch,
  component: HomePage,
})

const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$nftId',
  staticData: { isMarketPage: true },
  component: NftDetailPage,
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  staticData: { title: 'Carrinho de NFTs', isMarketPage: true },
  component: CartPage,
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  validateSearch: parseCheckoutSearch,
  staticData: { title: 'Pagamento com carteira', isMarketPage: true },
  component: CheckoutPage,
})

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account',
  validateSearch: parseAccountSearch,
  staticData: { title: 'Meu perfil' },
  component: AccountPage,
})

export const router = createRouter({
  routeTree: rootRoute.addChildren([homeRoute, nftDetailRoute, cartRoute, checkoutRoute, accountRoute]),
  defaultErrorComponent: ({ reset }: ErrorComponentProps) => (
    <div className="py-10">
      <StateMessage
        icon={ICONS.offline}
        title="Algo deu errado"
        description="Não foi possível exibir esta página. Tente novamente."
        onRetry={reset}
      />
    </div>
  ),
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
  interface StaticDataRouteOption {
    title?: string
    isMarketPage?: boolean
  }
}
