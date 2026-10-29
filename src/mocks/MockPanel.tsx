import { Icon } from '@iconify/react'
import { useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { ICONS } from '@/constants/icons'
import { MOCK_COMMANDS } from '@/constants/realtime'
import { emitToRealtime } from '@/services/realtime'
import type { MarketAction } from '@/types/api'
import { expireAllSessions } from './auth'
import nftsData from './data/nfts.json'
import {
  getScenario,
  saveScenario,
  type FavoritesScenario,
  type MockScenario,
  type PaymentScenario,
  type WalletScenario,
} from './scenario'

const MARKET_ACTIONS: { action: MarketAction; label: string }[] = [
  { action: 'price-up', label: 'Preço +10%' },
  { action: 'price-down', label: 'Preço −10%' },
  { action: 'sell-out', label: 'Esgotar uma edição' },
  { action: 'restock', label: 'Repor estoque' },
]

const WALLET_OPTIONS: { value: WalletScenario; label: string }[] = [
  { value: 'approve', label: 'Aprova' },
  { value: 'reject', label: 'Recusa' },
]

const PAYMENT_OPTIONS: { value: PaymentScenario; label: string }[] = [
  { value: 'confirm', label: 'Confirma' },
  { value: 'decline', label: 'Recusa' },
  { value: 'timeout', label: 'Timeout' },
]

const FAVORITES_OPTIONS: { value: FavoritesScenario; label: string }[] = [
  { value: 'success', label: 'Salva' },
  { value: 'fail', label: 'Falha' },
]

const actionButtonClass = 'h-9 rounded-sm border border-primary px-2 text-xs text-primary hover:bg-primary/10'
const optionButtonClass =
  'h-8 flex-1 rounded-sm border px-2 text-xs aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:font-bold aria-pressed:text-primary-foreground'

type ScenarioOptionsProps<T extends string> = {
  label: string
  options: { value: T; label: string }[]
  selected: T
  onSelect: (value: T) => void
}

function ScenarioOptions<T extends string>({ label, options, selected, onSelect }: ScenarioOptionsProps<T>) {
  return (
    <div role="group" aria-label={label} className="mt-2">
      <p className="mb-1 text-xs text-sand">{label}</p>
      <div className="flex gap-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected === option.value}
            onClick={() => onSelect(option.value)}
            className={optionButtonClass}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function MockPanel() {
  const { nftId } = useParams({ strict: false })
  const [chosenNftId, setChosenNftId] = useState<number | null>(null)
  const [scenario, setScenario] = useState(getScenario)
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  const selectedNftId = chosenNftId ?? (Number(nftId) || nftsData[0].id)

  function changeScenario(changes: Partial<MockScenario>) {
    const newScenario = { ...scenario, ...changes }
    setScenario(newScenario)
    saveScenario(newScenario)
  }

  function expireSession() {
    expireAllSessions()
    setIsSessionExpired(true)
  }

  return (
    <>
      <button
        type="button"
        popoverTarget="mock-panel"
        aria-label="Simular tempo real (mock)"
        title="Simular tempo real (mock)"
        className="fixed bottom-24 left-4 z-40 grid size-11 place-items-center rounded-full border border-primary bg-surface text-primary shadow-lg hover:bg-surface-3 desktop:bottom-6 desktop:left-6"
      >
        <Icon icon={ICONS.market} className="size-5" aria-hidden />
      </button>

      <div
        id="mock-panel"
        popover="auto"
        className="fixed inset-auto bottom-40 left-4 m-0 max-h-[calc(100dvh-180px)] w-72 overflow-y-auto rounded-xl border bg-surface p-4 text-foreground desktop:bottom-20 desktop:left-6 desktop:max-h-[calc(100dvh-110px)]"
      >
        <p className="font-bold">Tempo real (mock)</p>
        <p className="mt-1 text-xs text-gray">Dispara nft.updated pelo Socket.IO simulado, para todas as abas abertas.</p>

        <label htmlFor="mock-nft" className="mt-4 block text-sm">
          NFT
        </label>
        <select
          id="mock-nft"
          value={selectedNftId}
          onChange={(event) => setChosenNftId(Number(event.target.value))}
          className="mt-1 h-10 w-full rounded-sm border bg-background px-2 text-sm"
        >
          {nftsData.map((nft) => (
            <option key={nft.id} value={nft.id}>
              {nft.name}
            </option>
          ))}
        </select>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {MARKET_ACTIONS.map((item) => (
            <button
              key={item.action}
              type="button"
              onClick={() => emitToRealtime(MOCK_COMMANDS.nftAction, selectedNftId, item.action)}
              className={actionButtonClass}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => emitToRealtime(MOCK_COMMANDS.resetMarket)}
          className="mt-3 h-9 w-full rounded-sm bg-primary text-xs font-bold text-primary-foreground hover:brightness-110"
        >
          Restaurar preços e estoques
        </button>

        <p className="mt-5 border-t pt-4 font-bold">Cenários (mock)</p>
        <p className="mt-1 text-xs text-gray">Valem para as próximas requisições.</p>
        <ScenarioOptions
          label="Conexão da carteira"
          options={WALLET_OPTIONS}
          selected={scenario.wallet}
          onSelect={(wallet) => changeScenario({ wallet })}
        />
        <ScenarioOptions
          label="Resultado do pagamento"
          options={PAYMENT_OPTIONS}
          selected={scenario.payment}
          onSelect={(payment) => changeScenario({ payment })}
        />
        <ScenarioOptions
          label="Favoritos"
          options={FAVORITES_OPTIONS}
          selected={scenario.favorites}
          onSelect={(favorites) => changeScenario({ favorites })}
        />
        <button type="button" onClick={expireSession} className={`${actionButtonClass} mt-3 w-full`}>
          {isSessionExpired ? 'Sessões expiradas' : 'Expirar sessão no servidor'}
        </button>
      </div>
    </>
  )
}
