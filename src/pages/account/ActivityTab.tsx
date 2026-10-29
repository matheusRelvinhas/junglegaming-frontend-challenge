import { Icon } from '@iconify/react'
import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/Skeleton'
import { StateMessage } from '@/components/StateMessage'
import { CATALOG_SECTION_ID, getNetworkLabel } from '@/constants/catalog'
import { ICONS } from '@/constants/icons'
import { useAppContext } from '@/context/AppContext'
import { useOrders } from '@/services/account'
import type { Order } from '@/types/api'
import { range } from '@/utils/array'
import { formatShortDate } from '@/utils/date'
import { formatEth, shortenAddress } from '@/utils/eth'

function PurchasedOrder({ order }: { order: Order }) {
  return (
    <article aria-label={`Pedido ${order.id}`} className="rounded-xl bg-surface p-4 desktop:rounded-none desktop:p-5">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div>
          <p className="font-bold">{formatShortDate(order.created_at)}</p>
          <p className="text-xs text-sand">
            Pedido {order.id} · {getNetworkLabel(order.network)}
            {order.tx_hash && ` · Transação ${shortenAddress(order.tx_hash)}`}
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
          <Icon icon={ICONS.check} className="size-3.5" aria-hidden />
          Confirmado
        </span>
      </header>

      <ul className="mt-3 grid gap-3">
        {order.lines.map((line) => (
          <li key={`${line.nft_id}-${line.edition}`} className="grid grid-cols-[56px_1fr_auto] items-center gap-3">
            <img src={line.url_img} alt={line.name} width={56} height={56} className="size-14 rounded-md object-cover" />
            <div className="min-w-0">
              <Link to="/nft/$nftId" params={{ nftId: String(line.nft_id) }} className="block truncate font-bold hover:text-primary">
                {line.name}
              </Link>
              <p className="text-xs text-sand">
                Edição {line.edition_label} · {line.quantity} {line.quantity === 1 ? 'unidade' : 'unidades'}
              </p>
            </div>
            <span className="font-bold whitespace-nowrap text-primary">{formatEth(line.line_total)} ETH</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 flex justify-between border-t pt-3 font-bold">
        <span>Total pago</span>
        <span className="text-primary">{formatEth(order.total)} ETH</span>
      </p>
    </article>
  )
}

export function ActivityTab() {
  const { sessionToken } = useAppContext()
  const orders = useOrders(sessionToken)

  if (orders.isPending) {
    return (
      <div className="grid gap-4">
        {range(2).map((index) => (
          <Skeleton key={index} className="h-[180px] rounded-xl desktop:rounded-none" />
        ))}
      </div>
    )
  }
  if (orders.isError) {
    return (
      <StateMessage icon={ICONS.offline} title="Não foi possível carregar suas compras" description={orders.error.message} onRetry={() => orders.refetch()} />
    )
  }

  const confirmedOrders = orders.data.filter((order) => order.status === 'confirmed')
  if (confirmedOrders.length === 0) {
    return (
      <StateMessage
        icon={ICONS.cart}
        title="Você ainda não comprou NFTs"
        description="Suas compras confirmadas aparecem aqui."
        action={
          <Link to="/" hash={CATALOG_SECTION_ID}>
            Explorar NFTs
          </Link>
        }
      />
    )
  }

  return (
    <div className="grid gap-4">
      {confirmedOrders.map((order) => (
        <PurchasedOrder key={order.id} order={order} />
      ))}
    </div>
  )
}
