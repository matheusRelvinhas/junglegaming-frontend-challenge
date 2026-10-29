const shortDateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

export function formatShortDate(isoDate: string) {
  return shortDateFormat.format(new Date(isoDate))
}
