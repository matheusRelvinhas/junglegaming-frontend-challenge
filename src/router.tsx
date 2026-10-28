import { createRootRoute, createRoute, createRouter, Outlet, type ErrorComponentProps } from '@tanstack/react-router'
import { Layout } from '@/app/layout'
import { StateMessage } from '@/components/StateMessage'
import { COLLECTIONS, NETWORKS } from '@/constants/catalog'
import { ICONS } from '@/constants/icons'
import { AppProvider } from '@/context/AppProvider'
import type { AuthMode } from '@/hooks/useAuthModal'
import { CartPage } from '@/pages/cart/CartPage'
import { HomePage } from '@/pages/home/HomePage'
import { NftDetailPage } from '@/pages/nft-detail/NftDetailPage'
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

  return {
    search: toText(search.search) || undefined,
    collection: collection?.slug,
    network: network?.slug,
    min_price: toPrice(search.min_price),
    max_price: toPrice(search.max_price),
    page: toPage(search.page),
  }
}

function parseRootSearch(search: Record<string, unknown>): { auth?: AuthMode } {
  const auth = search.auth
  return { auth: auth === 'login' || auth === 'signup' ? auth : undefined }
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

export const router = createRouter({
  routeTree: rootRoute.addChildren([homeRoute, nftDetailRoute, cartRoute]),
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
