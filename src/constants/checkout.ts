import type { WalletProvider } from '@/types/api'
import type { CheckoutValues } from '@/utils/validation'
import { NETWORK_OPTIONS } from './catalog'
import { ICONS } from './icons'

export const WALLET_PROVIDERS: { id: WalletProvider; label: string; icon: string }[] = [
  { id: 'walletconnect', label: 'WalletConnect', icon: ICONS.walletconnect },
  { id: 'metamask', label: 'MetaMask', icon: ICONS.metamask },
  { id: 'coinbase', label: 'Coinbase Wallet', icon: ICONS.coinbase },
]

export function getWalletProviderLabel(provider: WalletProvider) {
  return WALLET_PROVIDERS.find((wallet) => wallet.id === provider)?.label
}

const WALLET_TYPES = ['Extensão do navegador', 'App no celular', 'Carteira física (hardware)']
export const WALLET_TYPE_OPTIONS = WALLET_TYPES.map((walletType) => ({ value: walletType, label: walletType }))

export const WALLET_SECTION_ID = 'checkout-wallet'

export const ROUND_CHOICE_INPUT_CLASS =
  'grid size-4 shrink-0 cursor-pointer appearance-none place-items-center rounded-full border-[1.5px] border-primary before:size-2 before:scale-0 before:rounded-full before:bg-primary checked:before:scale-100'

export type ProfileField = {
  name: Exclude<keyof CheckoutValues, 'use_secondary_wallet'>
  label: string
  isOptional?: boolean
  type?: 'text' | 'email'
  placeholder?: string
  autoComplete?: string
  options?: { value: string; label: string }[]
  suffix?: string
}

export const PROFILE_FIELDS: ProfileField[] = [
  { name: 'display_name', label: 'Nome de exibição', autoComplete: 'name' },
  { name: 'username', label: 'Nome de usuário', autoComplete: 'username' },
  { name: 'network', label: 'Rede', placeholder: 'Selecione uma rede', options: NETWORK_OPTIONS },
  { name: 'profile_name', label: 'Nome do perfil' },
  {
    name: 'wallet_address',
    label: 'Endereço da carteira',
    isOptional: true,
    placeholder: 'Vazio = carteira conectada',
    autoComplete: 'off',
  },
  { name: 'secondary_wallet', label: 'Carteira secundária', isOptional: true, placeholder: 'ENS ou endereço 0x', autoComplete: 'off' },
  { name: 'wallet_type', label: 'Tipo de carteira', placeholder: 'Selecione uma carteira', options: WALLET_TYPE_OPTIONS },
  { name: 'referral_code', label: 'Código de indicação', isOptional: true, placeholder: 'Ex.: KURIO-NOVA', autoComplete: 'off' },
  { name: 'email', label: 'E-mail', type: 'email', autoComplete: 'email' },
  { name: 'ens_name', label: 'Nome ENS', placeholder: 'seunome', suffix: '.eth', autoComplete: 'off' },
]

export const CHECKOUT_FIELD_ORDER: (keyof CheckoutValues)[] = [...PROFILE_FIELDS.map((field) => field.name), 'note']

export function checkoutFieldId(fieldName: keyof CheckoutValues) {
  return `checkout-${fieldName}`
}
