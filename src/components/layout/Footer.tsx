import { Icon } from '@iconify/react'
import { Link } from '@tanstack/react-router'
import { COLLECTIONS } from '@/constants/catalog'
import { ICONS } from '@/constants/icons'

const FEATURES = [
  { letter: 'W', title: 'Segurança da carteira', text: 'Proteja sua carteira e colecione arte digital verificada com confiança.' },
  { letter: 'C', title: 'Criadores em destaque', text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.' },
  { letter: 'D', title: 'Alertas de lançamentos', text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.' },
]

const TEXT_COLUMNS = [
  { title: 'Meu perfil', items: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'] },
  { title: 'Central de ajuda', items: ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item'] },
]
const FOOTER_COLLECTIONS = COLLECTIONS.filter((collection) =>
  ['digital-art', 'photography', 'music', '3d-art', 'utility'].includes(collection.slug),
)
const SOCIAL_ICONS = [ICONS.facebook, ICONS.instagram, ICONS.twitter, ICONS.linkedin, ICONS.youtube]

export function Footer() {
  return (
    <footer className="container mx-auto mt-24 px-6 pb-8">
      <section className="grid grid-cols-[repeat(3,1fr)_1.2fr] gap-4 bg-surface py-8 pr-8 pl-12">
        {FEATURES.map((feature) => (
          <div key={feature.letter} className="border-r border-primary pr-3">
            <span className="grid size-[74px] place-items-center rounded-full bg-primary text-[1.375rem] font-bold text-primary-foreground">
              {feature.letter}
            </span>
            <h3 className="mt-3.5 mb-2.5 text-[1.0625rem] font-bold">{feature.title}</h3>
            <p className="leading-[22px] text-sand">{feature.text}</p>
          </div>
        ))}
        <div>
          <h3 className="mb-5 text-[1.0625rem] font-bold leading-4">Antecipe-se ao próximo lançamento</h3>
          <div className="mb-4 flex" title="Em breve">
            <label htmlFor="newsletter-email" className="sr-only">E-mail</label>
            <input
              id="newsletter-email"
              type="email"
              disabled
              placeholder="digite seu e-mail..."
              className="h-10 min-w-0 flex-1 bg-surface-3 px-3"
            />
            <button type="button" disabled className="bg-primary px-4 text-lg font-bold text-primary-foreground disabled:opacity-60">
              Enviar
            </button>
          </div>
          <p className="text-[0.8125rem] leading-[22px] text-sand">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </div>
      </section>

      <section className="grid min-h-[88px] grid-cols-4 items-center bg-surface-3 px-8 py-5">
        <span className="text-[0.8125rem] font-bold tracking-[0.14em]">KURIO</span>
        <span>Feito para colecionadores,<br />criadores e cultura</span>
        <span>contato@email.com</span>
        <span>+55 11 4002 8922</span>
      </section>

      <section className="grid grid-cols-4 bg-surface px-8 pt-6 pb-8">
        {TEXT_COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="mb-1.5 text-lg font-bold">{column.title}</h3>
            <ul className="grid gap-2">
              {column.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="mb-1.5 text-lg font-bold">Coleções</h3>
          <ul className="grid gap-2">
            {FOOTER_COLLECTIONS.map((collection) => (
              <li key={collection.slug}>
                <Link to="/" search={{ collection: collection.slug }} className="hover:text-primary">
                  {collection.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-1.5 text-lg font-bold">Redes sociais</h3>
          <ul className="mt-3 mb-7 flex gap-2" aria-label="Redes sociais">
            {SOCIAL_ICONS.map((icon) => (
              <li key={icon} className="grid size-8 place-items-center rounded-sm border border-primary text-primary">
                <Icon icon={icon} className="size-5" aria-hidden />
              </li>
            ))}
          </ul>
          <h3 className="text-lg font-bold">Carteiras compatíveis</h3>
          <span className="mt-2.5 inline-flex gap-2.5 rounded-sm border bg-surface-3 px-2.5 py-1.5 text-[0.53rem] font-bold text-primary">
            METAMASK <span aria-hidden>•</span> WALLETCONNECT <span aria-hidden>•</span> COINBASE
          </span>
        </div>
      </section>

      <p className="mt-3.5 text-center">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}
