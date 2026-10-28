import { Icon } from '@iconify/react'
import { ICONS } from '@/constants/icons'

const SIZE_CLASSES = {
  md: { group: 'gap-3.5', button: 'h-[46px] w-8 rounded-2xl', icon: 'size-5', value: 'text-lg' },
  sm: { group: 'gap-2.5', button: 'h-[22px] w-[18px] rounded-full', icon: 'size-3', value: 'text-base' },
}

type QuantityStepperProps = {
  value: number
  max: number
  onChange: (value: number) => void
  label?: string
  size?: keyof typeof SIZE_CLASSES
}

export function QuantityStepper({ value, max, onChange, label = 'Quantidade', size = 'md' }: QuantityStepperProps) {
  const sizeClasses = SIZE_CLASSES[size]
  const buttonClass = `grid place-items-center bg-primary text-primary-foreground disabled:opacity-40 ${sizeClasses.button}`

  return (
    <div role="group" aria-label={label} className={`flex items-center ${sizeClasses.group}`}>
      <button type="button" aria-label="Diminuir quantidade" disabled={value <= 1} onClick={() => onChange(value - 1)} className={buttonClass}>
        <Icon icon={ICONS.minus} className={sizeClasses.icon} aria-hidden />
      </button>
      <output aria-live="polite" className={`min-w-5 text-center ${sizeClasses.value}`}>
        {value}
      </output>
      <button type="button" aria-label="Aumentar quantidade" disabled={value >= max} onClick={() => onChange(value + 1)} className={buttonClass}>
        <Icon icon={ICONS.plus} className={sizeClasses.icon} aria-hidden />
      </button>
    </div>
  )
}
