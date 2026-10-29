import { Icon } from '@iconify/react'
import { useState } from 'react'
import { CouponForm } from '@/components/CouponForm'
import { Skeleton } from '@/components/Skeleton'
import { ICONS } from '@/constants/icons'
import { useAppContext } from '@/context/AppContext'
import type { Quote, QuoteLine } from '@/types/api'
import { formatEth } from '@/utils/eth'

type SummaryValues = Pick<Quote, 'lines' | 'subtotal' | 'discount' | 'network_fee' | 'total'>

function isSameLine(first: QuoteLine, second: QuoteLine) {
  return first.nft_id === second.nft_id && first.edition === second.edition
}

function SummaryLine({ line }: { line: QuoteLine }) {
  return (
    <li className="grid h-[70px] grid-cols-[70px_1fr_auto] items-center gap-x-3 bg-surface pr-3">
      <img src={line.url_img} alt={line.name} width={70} height={70} className="size-[70px] rounded-md object-cover" />
      <div className="min-w-0">
        <p className="truncate text-[0.9375rem] font-bold">{line.name}</p>
        <p className="truncate text-[0.8125rem] text-sand">
          Token {line.token_id} · {line.edition_label}
        </p>
      </div>
      <span className="text-right text-[1.0625rem] font-bold whitespace-nowrap text-primary">
        <span className="block text-[0.8125rem] font-normal text-sand">(x {line.quantity})</span>
        {formatEth(line.line_total)} ETH
      </span>
    </li>
  )
}

function SummaryRow({ label, value, isLoading }: { label: string; value: string; isLoading: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt>{label}</dt>
      <dd className="text-[1.0625rem]">{isLoading ? <Skeleton className="h-5 w-24" /> : value}</dd>
    </div>
  )
}

type CheckoutSummaryProps = {
  summary?: SummaryValues
  isLoading: boolean
  warnings: string[]
  couponError: string | null
  canEditCoupon: boolean
}

export function CheckoutSummary({ summary, isLoading, warnings, couponError, canEditCoupon }: CheckoutSummaryProps) {
  const { coupon } = useAppContext()
  const [isCouponOpen, setIsCouponOpen] = useState(false)
  const isShowingSkeleton = isLoading || !summary

  return (
    <section aria-labelledby="your-nfts-title">
      <h2 id="your-nfts-title" className="mb-2 text-h3">
        Seus NFTs
      </h2>
      <div className="mb-3 flex justify-between border-b pb-1.5 text-base font-semibold">
        <span>NFTs</span>
        <span>Subtotal</span>
      </div>

      <ul className="grid gap-3">
        {isShowingSkeleton ? (
          <li>
            <Skeleton className="h-[70px]" />
          </li>
        ) : (
          summary.lines.map((line) => <SummaryLine key={`${line.nft_id}-${line.edition}`} line={line} />)
        )}
      </ul>

      {warnings.length > 0 && (
        <ul className="mt-3 grid gap-1 text-xs text-warning">
          {warnings.map((warning) => (
            <li key={warning} className="flex items-center gap-1.5">
              <Icon icon={ICONS.pending} className="size-4 shrink-0" aria-hidden />
              {warning}
            </li>
          ))}
        </ul>
      )}

      {canEditCoupon && (
        <div className="mt-4">
          {coupon || isCouponOpen ? (
            <CouponForm />
          ) : (
            <p className="mb-3 text-center">
              Tem um código promocional?{' '}
              <button type="button" onClick={() => setIsCouponOpen(true)} className="text-primary underline-offset-4 hover:underline">
                Aplique aqui
              </button>
            </p>
          )}
        </div>
      )}
      {couponError && (
        <p role="alert" className="mb-3 text-xs text-destructive">
          Cupom {coupon?.code}: {couponError}
        </p>
      )}

      <dl className="mt-2 grid gap-2.5">
        <SummaryRow label="Subtotal" value={`${formatEth(summary?.subtotal ?? '0')} ETH`} isLoading={isShowingSkeleton} />
        <SummaryRow label="Desconto do lançamento" value={`(-) ${formatEth(summary?.discount ?? '0')}`} isLoading={isShowingSkeleton} />
        <SummaryRow label="Taxa de rede" value={`${formatEth(summary?.network_fee ?? '0')} ETH`} isLoading={isShowingSkeleton} />
      </dl>
      <p className="text-center text-[0.6875rem] text-primary">Taxa estimada</p>

      <div className="mt-3 flex items-baseline justify-between border-t px-0 pt-2.5 font-bold desktop:px-10">
        <span>Total</span>
        {isShowingSkeleton ? (
          <Skeleton className="h-6 w-28" />
        ) : (
          <span className="text-lg text-primary">{formatEth(summary.total)} ETH</span>
        )}
      </div>
    </section>
  )
}

export function QuoteChangedBanner({ previous, current }: { previous: Quote; current: Quote }) {
  const changes: string[] = []

  current.lines.forEach((line) => {
    const previousLine = previous.lines.find((item) => isSameLine(item, line))
    if (!previousLine) return
    if (previousLine.price !== line.price) {
      changes.push(`${line.name}: preço de ${previousLine.price} para ${line.price} ETH.`)
    }
    if (previousLine.quantity !== line.quantity) {
      changes.push(`${line.name} (${line.edition_label}): quantidade disponível de ${previousLine.quantity} para ${line.quantity}.`)
    }
  })
  previous.lines.forEach((line) => {
    const isStillInQuote = current.lines.some((item) => isSameLine(item, line))
    if (!isStillInQuote) changes.push(`${line.name} (${line.edition_label}) esgotou e saiu do pedido.`)
  })
  if (previous.coupon && !current.coupon) {
    changes.push(`O cupom ${previous.coupon.code} deixou de valer.`)
  }

  return (
    <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm desktop:rounded-sm">
      <Icon icon={ICONS.refresh} className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
      <div>
        <p className="font-bold text-warning">Os valores mudaram desde a sua revisão</p>
        <ul className="mt-1 grid gap-1 text-sand">
          {changes.map((change) => (
            <li key={change}>{change}</li>
          ))}
          <li>
            Total: {formatEth(previous.total)} → <b className="text-foreground">{formatEth(current.total)} ETH</b>
          </li>
        </ul>
        <p className="mt-2 text-sand">Confira o resumo e confirme de novo para continuar.</p>
      </div>
    </div>
  )
}
