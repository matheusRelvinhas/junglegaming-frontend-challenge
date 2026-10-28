import { Layout } from '@/app/layout'
import { useAppContext } from '@/context/AppContext'
import { AppProvider } from '@/context/AppProvider'

function Placeholder() {
  const { isMobile } = useAppContext()

  return (
    <section className="flex flex-col items-start gap-6 py-10 desktop:py-16">
      <span className="text-sm font-bold tracking-[0.14em]">KURIO</span>
      <h1 className="text-h1 uppercase desktop:text-display">Base do projeto</h1>
      <p className="max-w-xl leading-6 text-sand">
        Tailwind, tokens do Figma, Context API e layout global configurados.
      </p>
      <span className="rounded-sm border border-border bg-surface px-3 py-1 text-primary">
        Layout atual: {isMobile ? 'mobile (< 1040px)' : 'desktop (≥ 1040px)'}
      </span>
      <button
        type="button"
        className="h-10 rounded-sm bg-primary px-6 font-bold text-primary-foreground hover:brightness-110"
      >
        EXPLORAR
      </button>
    </section>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <Placeholder />
      </Layout>
    </AppProvider>
  )
}
