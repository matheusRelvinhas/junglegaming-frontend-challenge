import { Icon } from '@iconify/react'
import { useState } from 'react'
import { ICONS } from '@/constants/icons'

const inputClass =
  'h-[50px] w-full min-w-0 rounded-sm border bg-transparent px-3 text-sm focus:border-primary focus:outline-none aria-invalid:border-destructive desktop:h-10'

function getAccessibilityProps(id: string, error?: string, isOptional?: boolean) {
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
    'aria-required': isOptional ? undefined : true,
  }
}

export function FieldLabel({ htmlFor, label, isOptional }: { htmlFor: string; label: string; isOptional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-[0.9375rem]">
      {label}
      {isOptional ? (
        <span className="text-sand"> (opcional)</span>
      ) : (
        <span aria-hidden className="ml-0.5 text-lg leading-none text-destructive">
          *
        </span>
      )}
    </label>
  )
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="flex items-center gap-1 text-xs text-destructive">
      <Icon icon={ICONS.declined} className="size-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  )
}

export function FormAlert({ message }: { message: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-6 flex items-center gap-1.5 text-sm text-destructive">
      <Icon icon={ICONS.declined} className="size-4 shrink-0" aria-hidden />
      {message}
    </p>
  )
}

type SubmitRowProps = {
  label: string
  pendingLabel: string
  isPending: boolean
  successMessage: string
}

// Botão de salvar + confirmação ("Perfil salvo.") lida por leitores de tela.
export function SubmitRow({ label, pendingLabel, isPending, successMessage }: SubmitRowProps) {
  return (
    <div className="mt-8 flex flex-col gap-3 desktop:flex-row desktop:items-center desktop:gap-5">
      <button
        type="submit"
        disabled={isPending}
        className="h-[50px] w-full rounded-sm bg-primary px-5 font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60 desktop:h-10 desktop:w-auto desktop:min-w-[131px]"
      >
        {isPending ? pendingLabel : label}
      </button>
      <p role="status" className="flex items-center gap-1.5 text-sm text-success empty:hidden">
        {successMessage && <Icon icon={ICONS.check} className="size-4" aria-hidden />}
        {successMessage}
      </p>
    </div>
  )
}

type BaseFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  isOptional?: boolean
  placeholder?: string
}

type TextFieldProps = BaseFieldProps & {
  type?: 'text' | 'email'
  autoComplete?: string
  suffix?: string
}

export function TextField({ id, label, value, onChange, error, isOptional, placeholder, type = 'text', autoComplete, suffix }: TextFieldProps) {
  return (
    <div className="grid content-start gap-2">
      <FieldLabel htmlFor={id} label={label} isOptional={isOptional} />
      <div className="flex">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          {...getAccessibilityProps(id, error, isOptional)}
          className={`${inputClass} ${suffix ? 'rounded-r-none' : ''}`}
        />
        {suffix && <span className="grid place-items-center rounded-r-sm border border-l-0 px-3 text-sand">{suffix}</span>}
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

type SelectFieldProps = BaseFieldProps & {
  options: { value: string; label: string }[]
}

export function SelectField({ id, label, value, onChange, error, isOptional, placeholder, options }: SelectFieldProps) {
  return (
    <div className="grid content-start gap-2">
      <FieldLabel htmlFor={id} label={label} isOptional={isOptional} />
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          {...getAccessibilityProps(id, error, isOptional)}
          className={`${inputClass} appearance-none pr-10 ${value ? '' : 'text-khaki'}`}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon icon={ICONS.chevronDown} className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-sand" aria-hidden />
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

type PasswordFieldProps = BaseFieldProps & {
  autoComplete: string
}

export function PasswordField({ id, label, value, onChange, error, autoComplete }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="grid content-start gap-2">
      <FieldLabel htmlFor={id} label={label} />
      <div className="relative">
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          {...getAccessibilityProps(id, error)}
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          aria-label={`${isVisible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-khaki hover:text-primary"
        >
          <Icon icon={isVisible ? ICONS.eye : ICONS.eyeClosed} className="size-5" aria-hidden />
        </button>
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}
