import { Link } from '@tanstack/react-router'
import { StateMessage } from '@/components/StateMessage'
import { ICONS } from '@/constants/icons'

type NotFoundPageProps = {
  title?: string
  description?: string
  linkLabel?: string
  hash?: string
}

export function NotFoundPage({
  title = 'Página não encontrada',
  description = 'O endereço acessado não existe ou foi removido.',
  linkLabel = 'Voltar para o início',
  hash,
}: NotFoundPageProps) {
  return (
    <div className="py-10">
      <StateMessage
        icon={ICONS.search}
        title={title}
        description={description}
        action={
          <Link to="/" hash={hash}>
            {linkLabel}
          </Link>
        }
      />
    </div>
  )
}
