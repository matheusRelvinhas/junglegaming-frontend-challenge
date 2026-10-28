import { Icon } from '@iconify/react'
import { ICONS } from '@/constants/icons'

type QuantityStepperProps = {
  value: number
  max: number
  onChange: (value: number) => void
}

const stepButtonClass =
  'grid h-[46px] w-8 place-items-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-40'

export function QuantityStepper({ value, max, onChange }: QuantityStepperProps) {
  return (
    <div role="group" aria-label="Quantidade" className="flex items-center gap-3.5">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        className={stepButtonClass}
      >
        <Icon icon={ICONS.minus} className="size-5" aria-hidden />
      </button>
      <output aria-live="polite" className="min-w-6 text-center text-lg">
        {value}
      </output>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={stepButtonClass}
      >
        <Icon icon={ICONS.plus} className="size-5" aria-hidden />
      </button>
    </div>
  )
}
