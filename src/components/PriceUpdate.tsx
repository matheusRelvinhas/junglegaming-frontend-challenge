import { Icon } from '@iconify/react'
import { ICONS } from '@/constants/icons'
import type { PriceChange } from '@/context/AppContext'

export function PriceUpdatedTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-normal text-warning">
      <Icon icon={ICONS.refresh} className="size-3" aria-hidden />
      Atualizado
    </span>
  )
}

type PriceChangeBannerProps = {
  changes: PriceChange[]
  onDismiss: () => void
}

export function PriceChangeBanner({ changes, onDismiss }: PriceChangeBannerProps) {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm desktop:rounded-sm">
      <Icon icon={ICONS.refresh} className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
      <div className="flex-1">
        <p className="font-bold text-warning">Preços atualizados</p>
        <ul className="mt-1 grid gap-1 text-sand">
          {changes.map((change) => (
            <li key={change.nft_id}>
              O preço de <b className="text-foreground">{change.name}</b> mudou de {change.previous_price} para{' '}
              <b className="text-foreground">{change.price} ETH</b>.
            </li>
          ))}
        </ul>
      </div>
      <button type="button" onClick={onDismiss} className="shrink-0 text-primary underline-offset-4 hover:underline">
        Entendi
      </button>
    </div>
  )
}
