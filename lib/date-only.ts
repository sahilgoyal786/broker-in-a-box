export function parseDateOnly(dateString: string | null | undefined) {
  if (!dateString) return null

  const [year, month, day] = dateString.split('-').map(Number)
  if (!year || !month || !day) return new Date(dateString)

  return new Date(year, month - 1, day)
}

export function formatDateOnly(dateString: string | null | undefined) {
  const date = parseDateOnly(dateString)
  return date ? date.toLocaleDateString() : ''
}

export function daysUntilDateOnly(dateString: string | null | undefined) {
  const date = parseDateOnly(dateString)
  if (!date) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function addYearsToDateOnly(dateString: string, years: number) {
  const date = parseDateOnly(dateString)
  if (!date) return dateString

  date.setFullYear(date.getFullYear() + years)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
