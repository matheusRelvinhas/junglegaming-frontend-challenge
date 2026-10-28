import { Icon } from '@iconify/react'
import { useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { ICONS } from '@/constants/icons'
import { MOCK_COMMANDS } from '@/constants/realtime'
import { emitToRealtime } from '@/services/realtime'
import type { MarketAction } from '@/types/api'
import nftsData from './data/nfts.json'

const MARKET_ACTIONS: { action: MarketAction; label: string }[] = [
  { action: 'price-up', label: 'Preço +10%' },
  { action: 'price-down', label: 'Preço −10%' },
  { action: 'sell-out', label: 'Esgotar uma edição' },
  { action: 'restock', label: 'Repor estoque' },
]

const actionButtonClass = 'h-9 rounded-sm border border-primary px-2 text-xs text-primary hover:bg-primary/10'

export function MockPanel() {
  const { nftId } = useParams({ strict: false })
  const [chosenNftId, setChosenNftId] = useState<number | null>(null)
  const selectedNftId = chosenNftId ?? (Number(nftId) || nftsData[0].id)

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
        className="fixed inset-auto bottom-40 left-4 m-0 w-72 rounded-xl border bg-surface p-4 text-foreground desktop:bottom-20 desktop:left-6"
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
      </div>
    </>
  )
}
