/** Formatting helpers shared by the item feed and the download buttons. */

/**
 * FastAPI/SQLAlchemy often returns naive datetimes
 * ("2026-09-23T08:14:22.123456"); those are UTC, but `new Date()` would read
 * them as local time. Adding the `Z` suffix keeps the timeline correct.
 */
export function parseApiDate(value) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const raw = String(value)
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)
  const date = new Date(hasTimezone ? raw : `${raw}Z`)

  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateTime(value) {
  const date = parseApiDate(value)
  if (!date) return '—'

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatRelativeTime(value) {
  const date = parseApiDate(value)
  if (!date) return '—'

  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 45) return 'just now'

  const table = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]

  for (const [unit, unitSeconds] of table) {
    const amount = Math.floor(seconds / unitSeconds)
    if (amount >= 1) {
      try {
        return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(-amount, unit)
      } catch {
        return `${amount} ${unit}${amount > 1 ? 's' : ''} ago`
      }
    }
  }

  return 'just now'
}

export function formatBytes(bytes, decimals = 1) {
  const value = Number(bytes)
  if (!Number.isFinite(value) || value <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  const size = value / 1024 ** index

  return `${size.toFixed(index === 0 ? 0 : decimals)} ${units[index]}`
}

export function truncate(value, maxLength = 70) {
  const text = String(value ?? '').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

export function countWords(value) {
  const text = String(value ?? '').trim()
  return text ? text.split(/\s+/).length : 0
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}
