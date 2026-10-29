import { Icon } from '@iconify/react'
import { DialogCloseButton, ModalDialog } from '@/components/ModalDialog'
import { getNetworkLabel } from '@/constants/catalog'
import { getWalletProviderLabel } from '@/constants/checkout'
import { ICONS } from '@/constants/icons'
import type { Order } from '@/types/api'
import { formatShortDate } from '@/utils/date'
import { formatEth, shortenAddress } from '@/utils/eth'

const lineColumnsClass = 'grid-cols-[56px_1fr_auto] desktop:grid-cols-[70px_1fr_90px_110px]'

type OrderReceiptDialogProps = {
  order: Order
  onClose: () => void
}

export function OrderReceiptDialog({ order, onClose }: OrderReceiptDialogProps) {
  const networkLabel = getNetworkLabel(order.network)
  const hasDiscount = Number(order.discount) > 0
  const receiptFacts = [
    { label: 'ID da transação', value: order.tx_hash ? shortenAddress(order.tx_hash) : '—' },
    { label: 'Data', value: formatShortDate(order.created_at) },
    { label: 'Total', value: `${formatEth(order.total)} ETH` },
    { label: 'Carteira', value: getWalletProviderLabel(order.wallet_provider) },
  ]

  return (
    <ModalDialog
      isOpen
      onClose={onClose}
      aria-labelledby="receipt-title"
      className="m-auto max-h-[92dvh] w-[calc(100%-32px)] max-w-[578px] overflow-y-auto border-b-[10px] border-primary bg-surface text-foreground backdrop:bg-background/70"
    >
      <div className="relative border-b border-primary px-6 pt-6 pb-5 text-center text-primary">
        <DialogCloseButton label="Fechar recibo" onClick={onClose} autoFocus className="absolute top-3 right-3" />
        <Icon icon={ICONS.thanks} className="mx-auto size-16" aria-hidden />
        <p className="mt-1 text-xs font-bold tracking-[0.2em]">THANK YOU</p>
        <h2 id="receipt-title" className="mt-2.5 text-base">
          Seus NFTs agora estão na sua carteira
        </h2>
      </div>

      <dl className="grid grid-cols-2 border-b border-primary py-3 text-sand desktop:grid-cols-4 desktop:py-3.5">
        {receiptFacts.map((fact) => (
          <div key={fact.label} className="px-4 py-1.5 leading-[19px] odd:border-r odd:border-primary desktop:border-r desktop:border-primary desktop:last:border-r-0">
            <dt className="font-semibold">{fact.label}</dt>
            <dd className="text-foreground">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="px-5 pt-5 pb-8 desktop:px-11 desktop:pb-12">
        <h3 className="font-bold">Detalhes da transação</h3>
        <div className={`mt-2 hidden border-b pb-2 text-base font-semibold desktop:grid desktop:gap-3 ${lineColumnsClass}`}>
          <span className="col-span-2">NFTs</span>
          <span>Edições</span>
          <span className="text-right">Subtotal</span>
        </div>
        <ul className="mt-3 grid gap-3">
          {order.lines.map((line) => (
            <li key={`${line.nft_id}-${line.edition}`} className={`grid items-center gap-3 ${lineColumnsClass}`}>
              <img src={line.url_img} alt={line.name} width={70} height={70} className="size-14 rounded-md object-cover desktop:size-[70px]" />
              <div className="min-w-0">
                <p className="truncate font-bold">{line.name}</p>
                <p className="text-xs text-sand">ID do token: {line.token_id}</p>
                <p className="text-xs text-sand">Edição {line.edition_label}</p>
              </div>
              <span className="hidden text-sand desktop:block">(x {line.quantity})</span>
              <span className="text-right text-base font-bold whitespace-nowrap text-primary desktop:text-lg">
                <span className="block text-xs font-normal text-sand desktop:hidden">(x {line.quantity})</span>
                {formatEth(line.line_total)} ETH
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-b pt-3 pb-2 desktop:pl-[170px]">
          <dt>Subtotal</dt>
          <dd className="text-right">{formatEth(order.subtotal)} ETH</dd>
          {hasDiscount && (
            <>
              <dt>Desconto</dt>
              <dd className="text-right">(-) {formatEth(order.discount)} ETH</dd>
            </>
          )}
          <dt>Taxa de rede</dt>
          <dd className="text-right text-[1.0625rem]">{formatEth(order.network_fee)} ETH</dd>
          <dt className="font-bold">Total</dt>
          <dd className="text-right text-lg font-bold text-primary">{formatEth(order.total)} ETH</dd>
        </dl>

        <p className="mx-auto mt-4 mb-6 max-w-[420px] text-center leading-[22px] text-primary">
          Transação confirmada na {networkLabel}. A propriedade foi transferida para sua carteira conectada (
          {shortenAddress(order.wallet_address)}) e registrada na rede.
        </p>
        <div className="text-center">
          <button
            type="button"
            disabled
            title="Simulado: a transação existe só neste ambiente de demonstração"
            className="h-11 rounded-sm bg-primary px-6 font-bold text-primary-foreground disabled:opacity-60"
          >
            Ver no Etherscan
          </button>
          <p className="mt-2 text-xs text-sand">Explorador indisponível: a transação é simulada.</p>
        </div>
      </div>
    </ModalDialog>
  )
}
