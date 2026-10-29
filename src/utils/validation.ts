import type { AuthMode } from '@/hooks/useAuthModal'
import type { CheckoutProfile, Network, Profile, Wallet } from '@/types/api'

export type AuthValues = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export type AuthErrors = Partial<Record<keyof AuthValues, string>>

export type CheckoutValues = CheckoutProfile & { network: Network | '' }

export type CheckoutErrors = Partial<Record<keyof CheckoutValues, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const WALLET_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/
const ENS_PATTERN = /^[a-z0-9-]{3,}\.eth$/i
const ENS_NAME_PATTERN = /^[a-z0-9-]{3,}$/i
const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/i
const REFERRAL_CODE_PATTERN = /^[a-z0-9-]{4,16}$/i
export const MIN_PASSWORD_LENGTH = 6
const MIN_NAME_LENGTH = 3
export const MAX_NOTE_LENGTH = 280

export function validateAuthForm(mode: AuthMode, values: AuthValues) {
  const errors: AuthErrors = {}

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (mode === 'login') {
    if (!values.password) errors.password = 'Informe sua senha.'
  } else {
    if (values.name.trim().length < MIN_NAME_LENGTH) {
      errors.name = `Use pelo menos ${MIN_NAME_LENGTH} caracteres no nome de usuário.`
    }
    if (values.password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
    }
    if (values.confirmPassword !== values.password) {
      errors.confirmPassword = 'As senhas não conferem.'
    }
  }

  return errors
}

export type ProfileErrors = Partial<Record<keyof Profile, string>>

export function validateProfileForm(values: Profile) {
  const errors: ProfileErrors = {}
  if (values.name.trim().length < MIN_NAME_LENGTH) errors.name = `Use pelo menos ${MIN_NAME_LENGTH} caracteres.`
  if (!USERNAME_PATTERN.test(values.username.trim())) errors.username = 'Use de 3 a 20 letras, números, ponto ou _.'
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Informe um e-mail válido.'
  if (values.ens_name.trim() && !ENS_NAME_PATTERN.test(values.ens_name.trim())) {
    errors.ens_name = 'Use pelo menos 3 letras, números ou hífen (sem o .eth).'
  }
  return errors
}

export type PasswordValues = {
  current_password: string
  new_password: string
  confirm_password: string
}

export type PasswordErrors = Partial<Record<keyof PasswordValues, string>>

export function validatePasswordForm(values: PasswordValues) {
  const errors: PasswordErrors = {}
  if (!values.current_password) errors.current_password = 'Informe sua senha atual.'
  if (values.new_password.length < MIN_PASSWORD_LENGTH) {
    errors.new_password = `A nova senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
  }
  if (values.confirm_password !== values.new_password) errors.confirm_password = 'As senhas não conferem.'
  return errors
}

export type WalletErrors = Partial<Record<keyof Wallet, string>>

export function validateWalletForm(wallet: Wallet) {
  const errors: WalletErrors = {}
  if (wallet.nickname.trim().length < 2) errors.nickname = 'Use pelo menos 2 caracteres.'
  if (!wallet.network) errors.network = 'Selecione uma rede.'
  if (!WALLET_ADDRESS_PATTERN.test(wallet.address.trim())) errors.address = 'Informe 0x seguido de 40 caracteres hexadecimais.'
  if (!wallet.wallet_type) errors.wallet_type = 'Selecione o tipo de carteira.'
  return errors
}

export function validateCheckoutForm(values: CheckoutValues) {
  const errors: CheckoutErrors = {}
  const secondaryWallet = values.secondary_wallet.trim()
  const walletAddress = values.wallet_address.trim()
  const referralCode = values.referral_code.trim()

  if (values.display_name.trim().length < MIN_NAME_LENGTH) {
    errors.display_name = `Use pelo menos ${MIN_NAME_LENGTH} caracteres.`
  }
  if (!USERNAME_PATTERN.test(values.username.trim())) {
    errors.username = 'Use de 3 a 20 letras, números, ponto ou _.'
  }
  if (!values.network) errors.network = 'Selecione uma rede.'
  if (values.profile_name.trim().length < MIN_NAME_LENGTH) {
    errors.profile_name = `Use pelo menos ${MIN_NAME_LENGTH} caracteres.`
  }
  if (walletAddress && !WALLET_ADDRESS_PATTERN.test(walletAddress)) {
    errors.wallet_address = 'Informe 0x seguido de 40 caracteres hexadecimais.'
  }
  if (values.use_secondary_wallet && !WALLET_ADDRESS_PATTERN.test(secondaryWallet)) {
    errors.secondary_wallet = 'Para pagar com outra carteira, informe o endereço 0x dela.'
  } else if (secondaryWallet && !WALLET_ADDRESS_PATTERN.test(secondaryWallet) && !ENS_PATTERN.test(secondaryWallet)) {
    errors.secondary_wallet = 'Use um endereço 0x ou um nome ENS (ex.: nova.eth).'
  }
  if (!values.wallet_type) errors.wallet_type = 'Selecione o tipo de carteira.'
  if (referralCode && !REFERRAL_CODE_PATTERN.test(referralCode)) {
    errors.referral_code = 'Use de 4 a 16 letras, números ou hífen.'
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Informe um e-mail válido.'
  if (!ENS_NAME_PATTERN.test(values.ens_name.trim())) {
    errors.ens_name = 'Use pelo menos 3 letras, números ou hífen (sem o .eth).'
  }
  if (values.note.length > MAX_NOTE_LENGTH) {
    errors.note = `Use no máximo ${MAX_NOTE_LENGTH} caracteres.`
  }

  return errors
}
