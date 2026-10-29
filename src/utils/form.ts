export function focusFirstError(prefix: string, errors: object) {
  const firstField = Object.keys(errors)[0]
  if (firstField) document.getElementById(`${prefix}-${firstField}`)?.focus()
}
