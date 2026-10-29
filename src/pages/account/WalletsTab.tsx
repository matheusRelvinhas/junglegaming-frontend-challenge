import { useState, type FormEvent } from 'react'
import { FormAlert, SelectField, SubmitRow, TextField } from '@/components/FormField'
import { Skeleton } from '@/components/Skeleton'
import { StateMessage } from '@/components/StateMessage'
import { NETWORK_OPTIONS } from '@/constants/catalog'
import { ROUND_CHOICE_INPUT_CLASS, WALLET_TYPE_OPTIONS } from '@/constants/checkout'
import { ICONS } from '@/constants/icons'
import { useAppContext } from '@/context/AppContext'
import { useSaveWallets, useWallets } from '@/services/account'
import type { Wallet, Wallets } from '@/types/api'
import { validateWalletForm } from '@/utils/validation'

type WalletSlot = 'primary' | 'secondary'
type WalletErrors = Record<string, string | undefined>

const EMPTY_WALLET: Wallet = { nickname: '', network: '', address: '', wallet_type: '' }

function walletFieldId(errorKey: string) {
  return errorKey.replace('.', '-')
}

function validateSlot(slot: WalletSlot, wallet: Wallet) {
  const fieldErrors = validateWalletForm(wallet)
  const slotErrors: WalletErrors = {}
  Object.keys(fieldErrors).forEach((fieldName) => {
    slotErrors[`${slot}.${fieldName}`] = fieldErrors[fieldName as keyof Wallet]
  })
  return slotErrors
}

function trimWallet(wallet: Wallet): Wallet {
  return { ...wallet, nickname: wallet.nickname.trim(), address: wallet.address.trim() }
}

function focusFirstWalletError(errors: WalletErrors) {
  const firstKey = Object.keys(errors)[0]
  if (firstKey) document.getElementById(walletFieldId(firstKey))?.focus()
}

type WalletFieldsProps = {
  slot: WalletSlot
  wallet: Wallet
  errors: WalletErrors
  onChange: (fieldName: keyof Wallet, value: string) => void
}

function WalletFields({ slot, wallet, errors, onChange }: WalletFieldsProps) {
  const fieldProps = (fieldName: keyof Wallet) => ({
    id: walletFieldId(`${slot}.${fieldName}`),
    value: wallet[fieldName],
    error: errors[`${slot}.${fieldName}`],
    onChange: (value: string) => onChange(fieldName, value),
  })

  return (
    <div className="mt-6 grid gap-5 desktop:grid-cols-2 desktop:gap-6">
      <TextField {...fieldProps('nickname')} label="Apelido da carteira" placeholder="Ex.: Principal" />
      <SelectField {...fieldProps('network')} label="Rede" placeholder="Selecione uma rede" options={NETWORK_OPTIONS} />
      <TextField {...fieldProps('address')} label="Endereço da carteira" placeholder="Endereço 0x da carteira" autoComplete="off" />
      <SelectField {...fieldProps('wallet_type')} label="Tipo de carteira" placeholder="Selecione uma carteira" options={WALLET_TYPE_OPTIONS} />
    </div>
  )
}

function WalletsForm({ initialWallets }: { initialWallets: Wallets }) {
  const { sessionToken } = useAppContext()
  const saveWallets = useSaveWallets(sessionToken)
  const [wallets, setWallets] = useState({
    primary: initialWallets.primary ?? EMPTY_WALLET,
    secondary: initialWallets.secondary ?? EMPTY_WALLET,
  })
  const [hasSecondary, setHasSecondary] = useState(initialWallets.secondary !== null)
  const [isSameAsPrimary, setIsSameAsPrimary] = useState(initialWallets.secondary_same_as_primary)
  const [errors, setErrors] = useState<WalletErrors>({})
  const [formError, setFormError] = useState('')
  const isSecondaryVisible = hasSecondary && !isSameAsPrimary

  function updateWallet(slot: WalletSlot, fieldName: keyof Wallet, value: string) {
    setWallets({ ...wallets, [slot]: { ...wallets[slot], [fieldName]: value } })
    setErrors({ ...errors, [`${slot}.${fieldName}`]: undefined })
    saveWallets.reset()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    const validationErrors = {
      ...validateSlot('primary', wallets.primary),
      ...(isSecondaryVisible ? validateSlot('secondary', wallets.secondary) : {}),
    }
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      focusFirstWalletError(validationErrors)
      return
    }

    const body: Wallets = {
      primary: trimWallet(wallets.primary),
      secondary: isSecondaryVisible ? trimWallet(wallets.secondary) : null,
      secondary_same_as_primary: isSameAsPrimary,
    }
    saveWallets.mutate(body, {
      onError: (error) => {
        if (!error.field) {
          setFormError(error.message)
          return
        }
        const fieldErrors = { [error.field]: error.message }
        setErrors(fieldErrors)
        focusFirstWalletError(fieldErrors)
      },
    })
  }

  return (
    <form onSubmit={submit} noValidate>
      <section aria-labelledby="primary-wallet-title">
        <h3 id="primary-wallet-title" className="text-[1.0625rem] font-bold">
          Carteira principal
        </h3>
        <p className="mt-1 text-sand">Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.</p>
        <WalletFields slot="primary" wallet={wallets.primary} errors={errors} onChange={(fieldName, value) => updateWallet('primary', fieldName, value)} />
      </section>

      <section aria-labelledby="secondary-wallet-title" className="mt-9">
        <div className="flex flex-col gap-3 desktop:flex-row desktop:items-start desktop:justify-between">
          <div>
            <h3 id="secondary-wallet-title" className="text-[1.0625rem] font-bold">
              Carteira secundária
            </h3>
            {!isSecondaryVisible && (
              <p className="mt-1 text-sand">
                {isSameAsPrimary ? 'Usa a mesma carteira da principal.' : 'Você ainda não adicionou uma carteira secundária.'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={isSameAsPrimary}
                onChange={(event) => setIsSameAsPrimary(event.target.checked)}
                className={ROUND_CHOICE_INPUT_CLASS}
              />
              Igual à carteira principal
            </label>
            {!isSameAsPrimary && (
              <button type="button" onClick={() => setHasSecondary(!hasSecondary)} className="font-bold text-primary hover:underline">
                {hasSecondary ? 'Remover' : 'Adicionar'}
              </button>
            )}
          </div>
        </div>
        {isSecondaryVisible && (
          <WalletFields slot="secondary" wallet={wallets.secondary} errors={errors} onChange={(fieldName, value) => updateWallet('secondary', fieldName, value)} />
        )}
      </section>

      <FormAlert message={formError} />
      <SubmitRow
        label="Salvar carteiras"
        pendingLabel="Salvando…"
        isPending={saveWallets.isPending}
        successMessage={saveWallets.isSuccess ? 'Carteiras salvas. Elas já aparecem no pagamento.' : ''}
      />
    </form>
  )
}

export function WalletsTab() {
  const { sessionToken } = useAppContext()
  const wallets = useWallets(sessionToken)

  if (wallets.isPending) return <Skeleton className="h-[420px]" />
  if (wallets.isError) {
    return (
      <StateMessage icon={ICONS.offline} title="Não foi possível carregar suas carteiras" description={wallets.error.message} onRetry={() => wallets.refetch()} />
    )
  }

  return <WalletsForm initialWallets={wallets.data} />
}
