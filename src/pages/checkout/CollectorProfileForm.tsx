import type { FormEvent } from 'react'
import { FieldError, FieldLabel, SelectField, TextField } from '@/components/FormField'
import { checkoutFieldId, PROFILE_FIELDS, ROUND_CHOICE_INPUT_CLASS, type ProfileField } from '@/constants/checkout'
import { MAX_NOTE_LENGTH, type CheckoutErrors, type CheckoutValues } from '@/utils/validation'

type ProfileFieldInputProps = {
  field: ProfileField
  value: string
  error?: string
  onChange: (value: string) => void
}

function ProfileFieldInput({ field, value, error, onChange }: ProfileFieldInputProps) {
  const sharedProps = {
    id: checkoutFieldId(field.name),
    label: field.label,
    value,
    onChange,
    error,
    isOptional: field.isOptional,
    placeholder: field.placeholder,
  }

  if (field.options) return <SelectField {...sharedProps} options={field.options} />
  return <TextField {...sharedProps} type={field.type} autoComplete={field.autoComplete} suffix={field.suffix} />
}

type CollectorProfileFormProps = {
  id: string
  values: CheckoutValues
  errors: CheckoutErrors
  isDisabled: boolean
  onChange: (fieldName: keyof CheckoutValues, value: string | boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function CollectorProfileForm({ id, values, errors, isDisabled, onChange, onSubmit }: CollectorProfileFormProps) {
  const noteId = checkoutFieldId('note')

  return (
    <form id={id} onSubmit={onSubmit} noValidate aria-labelledby="collector-profile-title">
      <fieldset disabled={isDisabled} className="min-w-0 disabled:opacity-60">
        <h2 id="collector-profile-title" className="mb-4 text-h3">
          Perfil do colecionador
        </h2>
        <div className="grid gap-5 desktop:grid-cols-2 desktop:gap-6">
          {PROFILE_FIELDS.map((field) => (
            <ProfileFieldInput
              key={field.name}
              field={field}
              value={values[field.name]}
              error={errors[field.name]}
              onChange={(value) => onChange(field.name, value)}
            />
          ))}
        </div>

        <label className="mt-7 mb-6 flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={values.use_secondary_wallet}
            onChange={(event) => onChange('use_secondary_wallet', event.target.checked)}
            className={`mt-0.5 ${ROUND_CHOICE_INPUT_CLASS}`}
          />
          <span>
            Usar outra carteira?
            <span className="block text-xs text-sand">Paga com a carteira secundária informada acima.</span>
          </span>
        </label>

        <div className="grid gap-2 desktop:max-w-[350px]">
          <FieldLabel htmlFor={noteId} label="Observação do colecionador" isOptional />
          <textarea
            id={noteId}
            value={values.note}
            onChange={(event) => onChange('note', event.target.value)}
            aria-invalid={errors.note ? true : undefined}
            aria-describedby={`${noteId}-count${errors.note ? ` ${noteId}-error` : ''}`}
            className="min-h-[150px] w-full resize-y rounded-sm border bg-transparent p-3 text-sm focus:border-primary focus:outline-none aria-invalid:border-destructive"
          />
          <p id={`${noteId}-count`} className="text-right text-xs text-sand">
            {values.note.length}/{MAX_NOTE_LENGTH}
          </p>
          <FieldError id={`${noteId}-error`} message={errors.note} />
        </div>
      </fieldset>
    </form>
  )
}
