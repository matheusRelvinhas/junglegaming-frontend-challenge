import { Icon } from '@iconify/react'
import type { ReactNode } from 'react'

type StateMessageProps = {
  icon: string
  title: string
  description: string
  action?: ReactNode
  onRetry?: () => void
}

export function StateMessage({ icon, title, description, action, onRetry }: StateMessageProps) {
  return (
    <div
      role={onRetry ? 'alert' : 'status'}
      className="flex flex-col items-center border border-dashed bg-surface px-6 py-10 text-center"
    >
      <Icon icon={icon} className="size-10 text-primary" aria-hidden />
      <h3 className="mt-3 text-base font-bold">{title}</h3>
      <p className="mt-1.5 text-sand">{description}</p>
      <div className="mt-4 empty:hidden *:inline-flex *:h-10 *:items-center *:rounded-sm *:bg-primary *:px-6 *:text-[0.9375rem] *:font-bold *:text-primary-foreground *:hover:brightness-110">
        {onRetry ? (
          <button type="button" onClick={onRetry}>
            Tentar novamente
          </button>
        ) : (
          action
        )}
      </div>
    </div>
  )
}
