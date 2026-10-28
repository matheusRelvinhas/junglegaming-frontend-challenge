import { Icon } from '@iconify/react'
import { Link } from '@tanstack/react-router'
import Big from 'big.js'
import { useState, type FormEvent } from 'react'
import { PriceChangeBanner } from '@/components/PriceUpdate'
import { QuantityStepper } from '@/components/QuantityStepper'
import { Skeleton } from '@/components/Skeleton'
import { StateMessage } from '@/components/StateMessage'
import { CATALOG_SECTION_ID } from '@/constants/catalog'
import { ICONS } from '@/constants/icons'
import { useAppContext, type CartItem } from '@/context/AppContext'
import { useAuthModal } from '@/hooks/useAuthModal'
import { useCartNfts } from '@/hooks/useCartNfts'
import { useApplyCoupon } from '@/services/nfts'
import type { Coupon, NftInfo } from '@/types/api'
import { ESTIMATED_NETWORK_FEE, formatEth } from '@/utils/eth'

const tableColumnsClass = 'desktop:grid-cols-[70px_1fr_90px_110px_100px_32px]'

type CartLine = {
  item: CartItem
  nft?: NftInfo
  editionLabel?: string
  available: number
  lineTotal: Big
}

function CartLineItem({ line }: { line: CartLine }) {
  const { updateCartQuantity, removeFromCart } = useAppContext()
  const { item, nft, editionLabel, available, lineTotal } = line
  const removeButton = (
    <button
      type="button"
      onClick={() => removeFromCart(item.nft_id, item.edition)}
      aria-label={`Remover ${nft?.name ?? 'NFT'} do carrinho`}
      className="grid size-8 place-items-center text-sand hover:text-primary"
    >
      <Icon icon={ICONS.trash} className="size-5" aria-hidden />
    </button>
  )

  if (!nft) {
    return (
      <li className="flex items-center justify-between rounded-xl bg-surface p-4 desktop:rounded-none">
        <p className="text-sand">Este NFT não está mais disponível.</p>
        {removeButton}
      </li>
    )
  }

  const isOverStock = item.quantity > available

  return (
    <li
      className={`grid grid-cols-[100px_1fr_auto_auto] grid-rows-[1fr_auto] items-center gap-x-3 overflow-hidden rounded-xl bg-surface pr-3 desktop:h-[70px] desktop:grid-rows-1 desktop:rounded-none desktop:pr-2 ${tableColumnsClass}`}
    >
      <img
        src={nft.url_img}
        alt={nft.name}
        width={100}
        height={100}
        className="row-span-2 size-[100px] rounded-xl object-cover desktop:row-span-1 desktop:size-[70px] desktop:rounded-none"
      />
      <div className="col-span-3 self-end pt-3 desktop:col-span-1 desktop:self-center desktop:pt-0">
        <Link to="/nft/$nftId" params={{ nftId: String(nft.id) }} className="text-sm font-bold hover:text-primary desktop:text-base">
          {nft.name}
        </Link>
        <p className="text-xs text-sand">
          <span className="hidden desktop:inline">{nft.token_id} · </span>Edição: {editionLabel}
        </p>
        {isOverStock && (
          <p className="text-xs text-warning">
            Só {available} disponíveis: {available === 0 ? 'remova este item' : 'a quantidade foi ajustada no total'}.
          </p>
        )}
      </div>
      <span className="hidden desktop:block">{nft.currency.ethereum} ETH</span>
      <div className="col-start-3 row-start-2 pb-3 desktop:col-start-auto desktop:row-start-auto desktop:pb-0">
        <QuantityStepper
          size="sm"
          value={item.quantity}
          max={available}
          onChange={(quantity) => updateCartQuantity(item.nft_id, item.edition, quantity)}
          label={`Quantidade de ${nft.name} (${editionLabel})`}
        />
      </div>
      <span className="col-start-2 row-start-2 pb-3 text-base font-bold whitespace-nowrap text-primary desktop:col-start-auto desktop:row-start-auto desktop:pb-0">
        {formatEth(lineTotal)} ETH
      </span>
      <div className="col-start-4 row-start-2 pb-3 desktop:col-start-auto desktop:row-start-auto desktop:pb-0">{removeButton}</div>
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

function CartSummary({ subtotal, isLoading }: { subtotal: Big; isLoading: boolean }) {
  const { user } = useAppContext()
  const { openAuth } = useAuthModal()
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const applyCoupon = useApplyCoupon()

  const discount = coupon ? subtotal.times(coupon.discount_percent).div(100) : new Big(0)
  const networkFee = new Big(ESTIMATED_NETWORK_FEE)
  const total = subtotal.minus(discount).plus(networkFee)

  function submitCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    applyCoupon.mutate(couponCode.trim(), {
      onSuccess: (validCoupon) => {
        setCoupon(validCoupon)
        setCouponCode('')
      },
    })
  }

  function removeCoupon() {
    setCoupon(null)
    applyCoupon.reset()
  }

  return (
    <aside
      aria-labelledby="cart-summary-title"
      className="rounded-t-[32px] bg-surface p-6 desktop:rounded-none desktop:bg-transparent desktop:p-0"
    >
      <h2 id="cart-summary-title" className="mb-5 border-b pb-2 text-h3">
        Resumo da carteira
      </h2>

      {coupon ? (
        <div className="flex items-center justify-between gap-3 rounded-full border border-primary px-4 py-2 text-sm desktop:rounded-sm">
          <span>
            Cupom <b className="text-primary">{coupon.code}</b> (-{coupon.discount_percent}%)
          </span>
          <button type="button" onClick={removeCoupon} className="text-primary underline-offset-4 hover:underline">
            Remover
          </button>
        </div>
      ) : (
        <form onSubmit={submitCoupon}>
          <label htmlFor="coupon-code" className="sr-only desktop:not-sr-only desktop:mb-1.5 desktop:block desktop:text-[0.8125rem] desktop:font-bold">
            Código promocional
          </label>
          <div className="flex h-12 overflow-hidden rounded-full border desktop:h-10 desktop:rounded-none desktop:border-primary">
            <input
              id="coupon-code"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="Digite o código promocional..."
              autoComplete="off"
              aria-invalid={applyCoupon.isError}
              aria-describedby="coupon-feedback"
              className="min-w-0 flex-1 bg-transparent px-4 text-xs outline-none desktop:px-2"
            />
            <button
              type="submit"
              disabled={!couponCode.trim() || applyCoupon.isPending}
              className="rounded-full bg-linear-to-r from-primary to-primary-dark px-4 font-bold text-primary-foreground disabled:opacity-60 desktop:rounded-none desktop:bg-none desktop:bg-primary"
            >
              {applyCoupon.isPending ? 'Aplicando…' : 'Aplicar'}
            </button>
          </div>
        </form>
      )}
      <p id="coupon-feedback" role="alert" className="mt-1.5 mb-3 min-h-5 text-xs text-destructive">
        {applyCoupon.error?.message}
      </p>

      <dl className="grid gap-2.5">
        <SummaryRow label="Subtotal" value={`${formatEth(subtotal)} ETH`} isLoading={isLoading} />
        <SummaryRow label="Desconto do lançamento" value={`(-) ${formatEth(discount)}`} isLoading={isLoading} />
        <SummaryRow label="Taxa de rede" value={`${formatEth(networkFee)} ETH`} isLoading={isLoading} />
      </dl>
      <p className="text-right text-[0.6875rem] text-primary">Taxa estimada</p>

      <div className="mt-4 mb-5 flex items-baseline justify-between font-bold">
        <span>Total</span>
        {isLoading ? <Skeleton className="h-6 w-28" /> : <span className="text-lg text-primary">{formatEth(total)} ETH</span>}
      </div>

      <button
        type="button"
        onClick={user ? undefined : () => openAuth('login')}
        className="h-[58px] w-full rounded-full bg-linear-to-r from-primary to-primary-dark text-[0.9375rem] font-bold text-primary-foreground desktop:h-10 desktop:rounded-sm desktop:bg-none desktop:bg-primary"
      >
        {user ? 'Finalizar' : 'Conectar e finalizar'}
      </button>
      <Link to="/" hash={CATALOG_SECTION_ID} className="mt-3 block text-center text-[0.9375rem] text-primary hover:underline">
        Continuar explorando
      </Link>
    </aside>
  )
}

export function CartOverview() {
  const { cartItems, priceChanges, dismissPriceChanges } = useAppContext()
  const { nftQueries, cartNfts } = useCartNfts()
  const cartPriceChanges = priceChanges.filter((change) => cartItems.some((item) => item.nft_id === change.nft_id))
  const isLoading = nftQueries.some((query) => query.isPending)
  const failedQueries = nftQueries.filter((query) => query.isError && query.error.status !== 404)

  if (cartItems.length === 0) {
    return (
      <StateMessage
        icon={ICONS.cart}
        title="Seu carrinho está vazio"
        description="Explore o mercado e adicione NFTs ao carrinho."
        action={
          <Link to="/" hash={CATALOG_SECTION_ID}>
            Explorar NFTs
          </Link>
        }
      />
    )
  }

  if (failedQueries.length > 0) {
    return (
      <StateMessage
        icon={ICONS.offline}
        title="Não foi possível carregar o carrinho"
        description={failedQueries[0].error?.message ?? ''}
        onRetry={() => failedQueries.forEach((query) => query.refetch())}
      />
    )
  }

  const lines: CartLine[] = cartItems.map((item) => {
    const nft = cartNfts.find((cartNft) => cartNft.id === item.nft_id)
    const edition = nft?.editions.find((nftEdition) => nftEdition.id === item.edition)
    const available = edition?.available ?? 0
    const lineTotal = nft ? new Big(nft.currency.ethereum).times(Math.min(item.quantity, available)) : new Big(0)
    return { item, nft, editionLabel: edition?.label, available, lineTotal }
  })

  let subtotal = new Big(0)
  lines.forEach((line) => {
    subtotal = subtotal.plus(line.lineTotal)
  })

  return (
    <div className="grid gap-6 desktop:grid-cols-[1fr_300px] desktop:items-start desktop:gap-10">
      <section aria-label="Itens do carrinho">
        {cartPriceChanges.length > 0 && (
          <PriceChangeBanner
            changes={cartPriceChanges}
            onDismiss={() => dismissPriceChanges(cartPriceChanges.map((change) => change.nft_id))}
          />
        )}
        <div className={`mb-3 hidden border-b pb-2 font-semibold desktop:grid desktop:gap-x-3 ${tableColumnsClass}`}>
          <span className="col-span-2">NFTs</span>
          <span>Preço</span>
          <span>Edições</span>
          <span>Total</span>
        </div>
        <ul className="grid gap-5 desktop:gap-3">
          {isLoading
            ? cartItems.map((item) => (
                <li key={`${item.nft_id}-${item.edition}`}>
                  <Skeleton className="h-[100px] rounded-xl desktop:h-[70px] desktop:rounded-none" />
                </li>
              ))
            : lines.map((line) => <CartLineItem key={`${line.item.nft_id}-${line.item.edition}`} line={line} />)}
        </ul>
      </section>

      <CartSummary subtotal={subtotal} isLoading={isLoading} />
    </div>
  )
}
