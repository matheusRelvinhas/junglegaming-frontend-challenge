import { useLocation } from '@tanstack/react-router'
import { ICONS } from '@/constants/icons'
import { useAuthModal } from '@/hooks/useAuthModal'
import { StateMessage } from './StateMessage'

type LoginRequiredProps = {
  title: string
}

export function LoginRequired({ title }: LoginRequiredProps) {
  const { openAuth } = useAuthModal()
  const currentHref = useLocation({ select: (location) => location.href })

  return (
    <StateMessage
      icon={ICONS.userOutline}
      title={title}
      description="Esta área exige uma conta. Depois do login você volta direto para cá."
      action={
        <button type="button" onClick={() => openAuth('login', currentHref)}>
          Entrar
        </button>
      }
    />
  )
}
