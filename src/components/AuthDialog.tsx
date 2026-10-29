import { Icon } from '@iconify/react'
import { useState, type FormEvent } from 'react'
import { ICONS } from '@/constants/icons'
import { useAppContext } from '@/context/AppContext'
import { useAuthModal, type AuthMode } from '@/hooks/useAuthModal'
import { useLogin, useRegister } from '@/services/auth'
import type { ApiError } from '@/types/api'
import { validateAuthForm, type AuthErrors, type AuthValues } from '@/utils/validation'
import { DialogCloseButton, ModalDialog } from './ModalDialog'

type AuthField = {
  name: keyof AuthValues
  label: string
  type: 'text' | 'email' | 'password'
  autoComplete: string
}

const MODES: Record<AuthMode, {
  title: string
  lead: string
  submit: string
  submitting: string
  switchQuestion: string
  switchAction: string
  fields: AuthField[]
}> = {
  login: {
    title: 'Entrar',
    lead: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
    submit: 'Entrar',
    submitting: 'Entrando…',
    switchQuestion: 'Novo na Kurio?',
    switchAction: 'Crie uma conta',
    fields: [
      { name: 'email', label: 'E-mail', type: 'email', autoComplete: 'email' },
      { name: 'password', label: 'Senha', type: 'password', autoComplete: 'current-password' },
    ],
  },
  signup: {
    title: 'Criar perfil de colecionador',
    lead: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
    submit: 'Criar conta',
    submitting: 'Criando conta…',
    switchQuestion: 'Já tem uma conta?',
    switchAction: 'Entre',
    fields: [
      { name: 'name', label: 'Nome de usuário', type: 'text', autoComplete: 'username' },
      { name: 'email', label: 'E-mail', type: 'email', autoComplete: 'email' },
      { name: 'password', label: 'Senha', type: 'password', autoComplete: 'new-password' },
      { name: 'confirmPassword', label: 'Confirmar senha', type: 'password', autoComplete: 'new-password' },
    ],
  },
}

const SOCIAL_LOGINS = [
  { label: 'Google', icon: ICONS.google },
  { label: 'Facebook', icon: ICONS.facebookColor },
]

function authInputId(fieldName: keyof AuthValues) {
  return `auth-${fieldName}`
}

type AuthInputProps = {
  field: AuthField
  isFirst: boolean
  value: string
  error?: string
  onChange: (value: string) => void
}

function AuthInput({ field, isFirst, value, error, onChange }: AuthInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const isPassword = field.type === 'password'
  const inputId = authInputId(field.name)
  const errorId = `${inputId}-error`

  return (
    <div>
      <label htmlFor={inputId} className="sr-only">
        {field.label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={isPassword && isPasswordVisible ? 'text' : field.type}
          data-autofocus={isFirst || undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.label}
          autoComplete={field.autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-[50px] w-full rounded-sm border bg-transparent px-4 text-sm focus:border-primary focus:outline-none aria-invalid:border-destructive desktop:h-10"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            aria-label={`${isPasswordVisible ? 'Ocultar' : 'Mostrar'} ${field.label.toLowerCase()}`}
            aria-pressed={isPasswordVisible}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-khaki hover:text-primary"
          >
            <Icon icon={isPasswordVisible ? ICONS.eye : ICONS.eyeClosed} className="size-5" aria-hidden />
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

type AuthFormProps = {
  mode: AuthMode
  registeredEmail: string
  onSwitchMode: (mode: AuthMode) => void
  onRegistered: (email: string) => void
  onLoggedIn: () => void
}

function AuthForm({ mode, registeredEmail, onSwitchMode, onRegistered, onLoggedIn }: AuthFormProps) {
  const { startSession } = useAppContext()
  const login = useLogin()
  const register = useRegister()
  const [values, setValues] = useState<AuthValues>({ name: '', email: registeredEmail, password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<AuthErrors>({})
  const [formError, setFormError] = useState('')

  const config = MODES[mode]
  const isSubmitting = login.isPending || register.isPending

  function updateValue(fieldName: keyof AuthValues, value: string) {
    setValues({ ...values, [fieldName]: value })
    setErrors({ ...errors, [fieldName]: undefined })
  }

  function showApiError(error: ApiError) {
    if (error.field) setErrors({ [error.field]: error.message })
    else setFormError(error.message)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    const validationErrors = validateAuthForm(mode, values)
    setErrors(validationErrors)
    const firstInvalidField = config.fields.find((field) => validationErrors[field.name])
    if (firstInvalidField) {
      document.getElementById(authInputId(firstInvalidField.name))?.focus()
      return
    }

    if (mode === 'login') {
      login.mutate(
        { email: values.email, password: values.password },
        {
          onSuccess: (response) => {
            startSession(response.token, response.user)
            onLoggedIn()
          },
          onError: showApiError,
        },
      )
    } else {
      register.mutate(
        { name: values.name, email: values.email, password: values.password },
        { onSuccess: () => onRegistered(values.email), onError: showApiError },
      )
    }
  }

  return (
    <div className="flex min-h-full flex-col px-7 pt-16 pb-8 desktop:px-20 desktop:pt-12 desktop:pb-10">
      <p aria-hidden className="mb-14 text-center text-[2rem] font-bold tracking-[0.14em] desktop:mb-8">
        KURIO
      </p>
      <h2 id="auth-title" className="mb-8 text-center text-[1.1875rem] font-bold desktop:mb-3">
        {config.title}
      </h2>
      <p className="mb-6 hidden text-center text-[0.8125rem] leading-4 desktop:block">{config.lead}</p>

      {registeredEmail && mode === 'login' && (
        <p role="status" className="mb-4 text-center text-sm text-success">
          Conta criada! Entre com seu e-mail e senha.
        </p>
      )}

      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        {config.fields.map((field, index) => (
          <AuthInput
            key={field.name}
            field={field}
            isFirst={index === 0}
            value={values[field.name]}
            error={errors[field.name]}
            onChange={(value) => updateValue(field.name, value)}
          />
        ))}

        {mode === 'login' && (
          <button type="button" disabled title="Em breve" className="self-end text-primary disabled:opacity-60">
            Esqueceu a senha?
          </button>
        )}

        {formError && (
          <p role="alert" className="text-center text-sm text-destructive">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 h-[60px] rounded-sm bg-primary text-base font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60 desktop:h-[45px]"
        >
          {isSubmitting ? config.submitting : config.submit}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-[0.8125rem] before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
        Ou continue com
      </div>
      <div className="flex flex-col gap-3">
        {SOCIAL_LOGINS.map((social) => (
          <button
            key={social.label}
            type="button"
            disabled
            title="Em breve"
            className="flex h-10 items-center justify-center gap-2.5 border text-[0.8125rem] text-sand disabled:opacity-60"
          >
            <Icon icon={social.icon} className="size-5" aria-hidden />
            Continuar com {social.label}
          </button>
        ))}
      </div>

      <p className="mt-auto pt-10 text-center text-sand desktop:pt-8">
        {config.switchQuestion}{' '}
        <button type="button" onClick={() => onSwitchMode(mode === 'login' ? 'signup' : 'login')} className="text-primary">
          {config.switchAction}
        </button>
      </p>
    </div>
  )
}

export function AuthDialog() {
  const { authMode, switchAuthMode, closeAuth, finishLogin } = useAuthModal()
  const [registeredEmail, setRegisteredEmail] = useState('')

  function switchMode(mode: AuthMode) {
    setRegisteredEmail('')
    switchAuthMode(mode)
  }

  function finishSignup(email: string) {
    setRegisteredEmail(email)
    switchAuthMode('login')
  }

  return (
    <ModalDialog
      isOpen={authMode !== undefined}
      onClose={closeAuth}
      aria-labelledby="auth-title"
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto bg-background text-foreground backdrop:bg-background/70 desktop:m-auto desktop:h-fit desktop:max-h-[90dvh] desktop:w-[500px] desktop:border-b-[10px] desktop:border-primary desktop:bg-surface"
    >
      <DialogCloseButton label="Fechar" onClick={closeAuth} className="absolute top-4 right-4" />
      {authMode && (
        <AuthForm
          key={authMode}
          mode={authMode}
          registeredEmail={registeredEmail}
          onSwitchMode={switchMode}
          onRegistered={finishSignup}
          onLoggedIn={finishLogin}
        />
      )}
    </ModalDialog>
  )
}
