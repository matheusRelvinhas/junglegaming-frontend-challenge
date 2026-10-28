import { Icon } from '@iconify/react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { PriceUpdatedTag } from '@/components/PriceUpdate'
import { QuantityStepper } from '@/components/QuantityStepper'
import { COLLECTIONS } from '@/constants/catalog'
import { ICONS } from '@/constants/icons'
import { isSameCartItem, useAppContext } from '@/context/AppContext'
import type { NftInfo } from '@/types/api'
import { range } from '@/utils/array'

const MAX_STARS = 5

type NftPurchasePanelProps = {
  nft: NftInfo
}

export function NftPurchasePanel({ nft }: NftPurchasePanelProps) {
  const { cartItems, addToCart, favoriteIds, toggleFavorite, priceChanges } = useAppContext()
  const [editionId, setEditionId] = useState(() => nft.editions.find((edition) => edition.available > 0)?.id)
  const [quantity, setQuantity] = useState(1)
  const navigate = useNavigate()

  const edition = nft.editions.find((item) => item.id === editionId)
  const quantityInCart = cartItems.find((item) => isSameCartItem(item, nft.id, editionId ?? ''))?.quantity ?? 0
  const maxQuantity = Math.max(0, (edition?.available ?? 0) - quantityInCart)
  const canBuy = maxQuantity > 0
  const selectedQuantity = Math.min(quantity, Math.max(maxQuantity, 1))
  const isFavorite = favoriteIds.includes(nft.id)
  const isPriceUpdated = priceChanges.some((change) => change.nft_id === nft.id)
  const collectionLabel = COLLECTIONS.find((collection) => collection.slug === nft.collection)?.label
  const filledStars = Math.round(nft.rating)
  const shareUrl = encodeURIComponent(window.location.href)
  const shareText = encodeURIComponent(nft.name)
  const shareLinks = [
    { label: 'Compartilhar no LinkedIn', icon: ICONS.linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}` },
    { label: 'Compartilhar por e-mail', icon: ICONS.mail, href: `mailto:?subject=${shareText}&body=${shareUrl}` },
    { label: 'Compartilhar no X (Twitter)', icon: ICONS.twitter, href: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}` },
  ]
  const nftFacts = [
    { label: 'ID do token', value: nft.token_id },
    { label: 'Coleção', value: collectionLabel },
    { label: 'Atributos', value: nft.attributes.join(', ') },
  ]

  function selectEdition(newEditionId: string) {
    setEditionId(newEditionId)
    setQuantity(1)
  }

  function buy() {
    if (!edition || !canBuy) return
    addToCart({ nft_id: nft.id, edition: edition.id, quantity: selectedQuantity })
    navigate({ to: '/cart' })
  }

  function buyButtonLabel() {
    if (!edition || edition.available === 0) return 'ESGOTADO'
    if (!canBuy) return 'LIMITE NO CARRINHO'
    return 'COMPRAR'
  }

  return (
    <section
      aria-labelledby="nft-title"
      className="rounded-[32px] bg-surface p-6 desktop:rounded-none desktop:bg-transparent desktop:p-0"
    >
      <div className="flex items-start justify-between gap-3">
        <h1 id="nft-title" className="text-xl font-bold desktop:text-h1">
          {nft.name}
        </h1>
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-primary px-1.5 py-0.5 text-xs font-bold desktop:hidden">
          <Icon icon={ICONS.star} className="size-3 text-primary" aria-hidden />
          {nft.rating.toFixed(1)}
          <span className="font-normal">({nft.reviews_count})</span>
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between gap-4 border-b pb-2">
        <p className="flex items-center gap-2 text-price whitespace-nowrap text-primary">
          <span key={nft.currency.ethereum} className={isPriceUpdated ? 'animate-price-flash rounded-sm' : undefined}>
            {nft.currency.ethereum} ETH
          </span>
          {isPriceUpdated && <PriceUpdatedTag />}
        </p>
        <p className="hidden items-center gap-1 text-[0.9375rem] desktop:flex">
          <span className="flex" role="img" aria-label={`Nota ${nft.rating.toFixed(1)} de ${MAX_STARS}`}>
            {range(MAX_STARS).map((star) => (
              <Icon
                key={star}
                icon={ICONS.star}
                className={`size-4 ${star <= filledStars ? 'text-primary' : 'text-khaki/40'}`}
                aria-hidden
              />
            ))}
          </span>
          {nft.reviews_count} avaliações de colecionadores
        </p>
      </div>

      <h2 className="mt-5 text-[0.9375rem] font-bold">Sobre este NFT:</h2>
      <p className="mt-3 leading-6 text-sand">{nft.description}</p>

      <h2 className="mt-4 text-[0.9375rem] font-bold">Edição:</h2>
      <ul aria-label="Edições" className="mt-2 flex flex-wrap gap-1.5">
        {nft.editions.map((item) => {
          const isSoldOut = item.available === 0
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={item.id === editionId}
                disabled={isSoldOut}
                title={isSoldOut ? 'Esgotada' : `${item.available} disponíveis`}
                onClick={() => selectEdition(item.id)}
                className="rounded-full border bg-surface px-2 py-0.5 text-sm text-sand aria-pressed:border-primary aria-pressed:text-primary disabled:line-through disabled:opacity-40 desktop:bg-surface-2"
              >
                {item.label}
                {isSoldOut && <span className="sr-only"> (esgotada)</span>}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-5 flex flex-col gap-4 desktop:flex-row desktop:items-center desktop:justify-between">
        <div>
          <QuantityStepper value={selectedQuantity} max={maxQuantity} onChange={setQuantity} />
          <p className="mt-2 text-xs text-khaki">
            {edition ? `${edition.available} disponíveis` : 'Todas as edições esgotadas'}
            {quantityInCart > 0 && ` · ${quantityInCart} no carrinho`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={buy}
            disabled={!canBuy}
            className="h-[52px] flex-1 rounded-full bg-linear-to-r from-primary to-primary-dark px-6 text-[0.9375rem] font-bold text-primary-foreground hover:brightness-110 disabled:opacity-50 desktop:h-10 desktop:w-[130px] desktop:flex-none desktop:rounded-sm desktop:bg-none desktop:bg-primary desktop:px-2 desktop:text-sm"
          >
            {buyButtonLabel()}
          </button>
          <button
            type="button"
            onClick={() => toggleFavorite(nft.id)}
            aria-pressed={isFavorite}
            className="flex h-[52px] items-center justify-center gap-2 rounded-full border border-primary px-5 text-sm text-primary hover:bg-primary/10 desktop:h-10 desktop:w-[130px] desktop:rounded-sm desktop:px-2"
          >
            <Icon icon={isFavorite ? ICONS.heart : ICONS.heartOutline} className="size-5" aria-hidden />
            {isFavorite ? 'Favoritado' : 'Favoritar'}
          </button>
        </div>
      </div>

      <dl className="mt-6 grid gap-2.5 text-[0.9375rem] text-sand">
        {nftFacts.map((fact) => (
          <div key={fact.label} className="flex gap-2">
            <dt>{fact.label}:</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex items-center gap-2 font-semibold">
        Compartilhar este NFT:
        {shareLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            aria-label={link.label}
            className="hover:text-primary"
          >
            <Icon icon={link.icon} className="size-[18px]" aria-hidden />
          </a>
        ))}
      </div>
    </section>
  )
}
