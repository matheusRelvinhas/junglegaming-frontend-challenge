import { Icon } from '@iconify/react'
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { FieldError, FormAlert, PasswordField, SubmitRow, TextField } from '@/components/FormField'
import { Skeleton } from '@/components/Skeleton'
import { StateMessage } from '@/components/StateMessage'
import { ICONS } from '@/constants/icons'
import { useAppContext } from '@/context/AppContext'
import { useChangePassword, useProfile, useUpdateProfile } from '@/services/account'
import type { ApiError, Profile } from '@/types/api'
import { focusFirstError } from '@/utils/form'
import {
  validatePasswordForm,
  validateProfileForm,
  type PasswordErrors,
  type PasswordValues,
  type ProfileErrors,
} from '@/utils/validation'

const MAX_AVATAR_BYTES = 500 * 1024
const EMPTY_PASSWORDS: PasswordValues = { current_password: '', new_password: '', confirm_password: '' }

function showApiError(error: ApiError, prefix: string, setErrors: (errors: Record<string, string>) => void, setFormError: (message: string) => void) {
  if (!error.field) {
    setFormError(error.message)
    return
  }
  const fieldErrors = { [error.field]: error.message }
  setErrors(fieldErrors)
  focusFirstError(prefix, fieldErrors)
}

function ProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const { sessionToken } = useAppContext()
  const updateProfile = useUpdateProfile(sessionToken)
  const [values, setValues] = useState(initialProfile)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [formError, setFormError] = useState('')
  const avatarInputRef = useRef<HTMLInputElement>(null)

  function updateValue(fieldName: keyof Profile, value: string | null) {
    setValues({ ...values, [fieldName]: value })
    setErrors({ ...errors, [fieldName]: undefined })
    updateProfile.reset()
  }

  function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, avatar_url: 'Escolha um arquivo de imagem.' })
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setErrors({ ...errors, avatar_url: 'Use uma imagem de até 500 KB.' })
      return
    }

    const reader = new FileReader()
    reader.onload = () => updateValue('avatar_url', String(reader.result))
    reader.readAsDataURL(file)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    const validationErrors = validateProfileForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      focusFirstError('profile', validationErrors)
      return
    }
    updateProfile.mutate(values, { onError: (error) => showApiError(error, 'profile', setErrors, setFormError) })
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-5 desktop:grid-cols-2 desktop:gap-x-7 desktop:gap-y-7">
        <TextField id="profile-name" label="Nome de exibição" value={values.name} onChange={(value) => updateValue('name', value)} error={errors.name} autoComplete="name" />
        <TextField id="profile-username" label="Nome de usuário" value={values.username} onChange={(value) => updateValue('username', value)} error={errors.username} autoComplete="username" />
        <TextField id="profile-email" label="E-mail" type="email" value={values.email} onChange={(value) => updateValue('email', value)} error={errors.email} autoComplete="email" />
        <TextField id="profile-ens_name" label="Nome ENS" isOptional suffix=".eth" placeholder="seunome" value={values.ens_name} onChange={(value) => updateValue('ens_name', value)} error={errors.ens_name} />
        <TextField id="profile-wallet_nickname" label="Apelido da carteira" isOptional value={values.wallet_nickname} onChange={(value) => updateValue('wallet_nickname', value)} />

        <div className="grid content-start gap-2">
          <span className="text-[0.9375rem]">Avatar</span>
          <div className="flex items-center gap-6">
            {values.avatar_url ? (
              <img src={values.avatar_url} alt="Seu avatar" width={50} height={50} className="size-[50px] rounded-full object-cover" />
            ) : (
              <span className="grid size-[50px] place-items-center rounded-full bg-surface-3 text-primary">
                <Icon icon={ICONS.image} className="size-5" aria-hidden />
              </span>
            )}
            <input ref={avatarInputRef} id="profile-avatar_url" type="file" accept="image/*" onChange={selectAvatar} className="sr-only" tabIndex={-1} aria-hidden />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              aria-describedby={errors.avatar_url ? 'profile-avatar_url-error' : undefined}
              className="h-10 w-[98px] rounded-sm bg-primary font-bold text-primary-foreground hover:brightness-110"
            >
              Alterar
            </button>
            <button
              type="button"
              onClick={() => updateValue('avatar_url', null)}
              disabled={!values.avatar_url}
              className="text-primary hover:underline disabled:opacity-40"
            >
              Remover
            </button>
          </div>
          <FieldError id="profile-avatar_url-error" message={errors.avatar_url} />
        </div>
      </div>

      <FormAlert message={formError} />
      <SubmitRow label="Salvar" pendingLabel="Salvando…" isPending={updateProfile.isPending} successMessage={updateProfile.isSuccess ? 'Perfil salvo.' : ''} />
    </form>
  )
}

function PasswordForm() {
  const { sessionToken } = useAppContext()
  const changePassword = useChangePassword(sessionToken)
  const [values, setValues] = useState(EMPTY_PASSWORDS)
  const [errors, setErrors] = useState<PasswordErrors>({})
  const [formError, setFormError] = useState('')

  function updateValue(fieldName: keyof PasswordValues, value: string) {
    setValues({ ...values, [fieldName]: value })
    setErrors({ ...errors, [fieldName]: undefined })
    changePassword.reset()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    const validationErrors = validatePasswordForm(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      focusFirstError('password', validationErrors)
      return
    }

    changePassword.mutate(
      { current_password: values.current_password, new_password: values.new_password },
      {
        onSuccess: () => setValues(EMPTY_PASSWORDS),
        onError: (error) => showApiError(error, 'password', setErrors, setFormError),
      },
    )
  }

  return (
    <form onSubmit={submit} noValidate aria-labelledby="password-title" className="mt-10">
      <h3 id="password-title" className="mb-5 text-base font-bold">
        Alterar senha
      </h3>
      <div className="grid gap-5 desktop:max-w-[417px]">
        <PasswordField id="password-current_password" label="Senha atual" value={values.current_password} onChange={(value) => updateValue('current_password', value)} error={errors.current_password} autoComplete="current-password" />
        <PasswordField id="password-new_password" label="Nova senha" value={values.new_password} onChange={(value) => updateValue('new_password', value)} error={errors.new_password} autoComplete="new-password" />
        <PasswordField id="password-confirm_password" label="Confirmar nova senha" value={values.confirm_password} onChange={(value) => updateValue('confirm_password', value)} error={errors.confirm_password} autoComplete="new-password" />
      </div>
      <FormAlert message={formError} />
      <SubmitRow label="Alterar senha" pendingLabel="Alterando…" isPending={changePassword.isPending} successMessage={changePassword.isSuccess ? 'Senha alterada.' : ''} />
    </form>
  )
}

export function ProfileTab() {
  const { sessionToken } = useAppContext()
  const profile = useProfile(sessionToken)

  if (profile.isPending) return <Skeleton className="h-[480px]" />
  if (profile.isError) {
    return (
      <StateMessage icon={ICONS.offline} title="Não foi possível carregar seu perfil" description={profile.error.message} onRetry={() => profile.refetch()} />
    )
  }

  return (
    <>
      <ProfileForm initialProfile={profile.data} />
      <PasswordForm />
    </>
  )
}
