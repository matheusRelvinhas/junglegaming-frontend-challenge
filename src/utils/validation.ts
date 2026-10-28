import type { AuthMode } from '@/hooks/useAuthModal'

export type AuthValues = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export type AuthErrors = Partial<Record<keyof AuthValues, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 6
const MIN_NAME_LENGTH = 3

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
