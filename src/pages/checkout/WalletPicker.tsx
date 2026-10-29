import { Icon } from '@iconify/react'
import { getNetworkLabel } from '@/constants/catalog'
import { getWalletProviderLabel, ROUND_CHOICE_INPUT_CLASS, WALLET_PROVIDERS, WALLET_SECTION_ID } from '@/constants/checkout'
import { ICONS } from '@/constants/icons'
import type { WalletConnection, WalletProvider } from '@/types/api'
import { shortenAddress } from '@/utils/eth'

type WalletPickerProps = {
  provider: WalletProvider
  connection: WalletConnection | null
  isConnecting: boolean
  connectError?: string
  isDisabled: boolean
  onProviderChange: (provider: WalletProvider) => void
  onConnect: () => void
  onDisconnect: () => void
}

export function WalletPicker({
  provider,
  connection,
  isConnecting,
  connectError,
  isDisabled,
  onProviderChange,
  onConnect,
  onDisconnect,
}: WalletPickerProps) {
  const providerLabel = getWalletProviderLabel(provider)

  return (
    <section id={WALLET_SECTION_ID} tabIndex={-1} aria-labelledby="wallet-title" className="mt-6">
      <h2 id="wallet-title" className="mb-4 text-h3 desktop:text-center">
        Carteira e rede
      </h2>

      <fieldset disabled={isDisabled} className="grid gap-3 disabled:opacity-60">
        <legend className="sr-only">Carteira para pagamento</legend>
        {WALLET_PROVIDERS.map((wallet) => (
          <label
            key={wallet.id}
            className="flex h-[52px] cursor-pointer items-center gap-3 rounded-xl border bg-surface px-4 has-checked:border-foreground has-focus-visible:outline-2 has-focus-visible:outline-ring desktop:h-[45px] desktop:rounded-none desktop:bg-transparent"
          >
            <input
              type="radio"
              name="wallet-provider"
              value={wallet.id}
              checked={provider === wallet.id}
              onChange={() => onProviderChange(wallet.id)}
              className={`${ROUND_CHOICE_INPUT_CLASS} focus-visible:outline-none`}
            />
            <Icon icon={wallet.icon} className="size-6" aria-hidden />
            {wallet.label}
          </label>
        ))}
      </fieldset>

      <div aria-live="polite" className="mt-3">
        {connection ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-success/40 bg-success/10 p-3 text-sm">
            <span className="flex items-center gap-2 text-success">
              <Icon icon={ICONS.check} className="size-5 shrink-0" aria-hidden />
              {providerLabel} conectada: {shortenAddress(connection.address)} ({getNetworkLabel(connection.network)})
            </span>
            <button
              type="button"
              onClick={onDisconnect}
              disabled={isDisabled}
              className="text-primary underline-offset-4 hover:underline disabled:opacity-60"
            >
              Desconectar
            </button>
          </div>
        ) : (
          <>
            {connectError && (
              <p role="alert" className="mb-2 flex items-center gap-1.5 text-sm text-destructive">
                <Icon icon={ICONS.declined} className="size-4 shrink-0" aria-hidden />
                {connectError}
              </p>
            )}
            <button
              type="button"
              onClick={onConnect}
              disabled={isConnecting || isDisabled}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-primary font-bold text-primary hover:bg-primary/10 disabled:opacity-60 desktop:h-10 desktop:rounded-sm"
            >
              <Icon icon={ICONS.wallet} className="size-5" aria-hidden />
              {isConnecting ? 'Conectando…' : `Conectar ${providerLabel}`}
            </button>
          </>
        )}
      </div>
    </section>
  )
}
