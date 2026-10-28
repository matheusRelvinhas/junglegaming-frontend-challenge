import { Link } from '@tanstack/react-router'
import { CATALOG_SECTION_ID } from '@/constants/catalog'

type BreadcrumbProps = {
  current?: string
}

export function Breadcrumb({ current }: BreadcrumbProps) {
  return (
    <nav aria-label="Trilha de navegação" className="mb-2 hidden text-[0.9375rem] font-semibold desktop:block">
      <Link to="/" className="hover:text-primary">
        Início
      </Link>
      {' / '}
      <Link to="/" hash={CATALOG_SECTION_ID} className="hover:text-primary">
        Mercado
      </Link>
      {current && ` / ${current}`}
    </nav>
  )
}
