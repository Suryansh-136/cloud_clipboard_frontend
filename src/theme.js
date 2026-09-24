/**
 * Theme state shared by the whole app.
 *
 * - Default follows the OS (`prefers-color-scheme`).
 * - A manual choice is persisted to `localStorage["theme"]`.
 * - The active theme is reflected as `data-theme` on `<html>` before paint,
 *   so the UI never flashes the wrong palette on reload or login.
 */

export const THEME_STORAGE_KEY = 'theme'

export function getSystemTheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark'
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function getStoredTheme() {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

export function resolveTheme() {
  return getStoredTheme() || getSystemTheme()
}

export function applyTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark'
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = next
    document.documentElement.style.colorScheme = next
  }
  return next
}

/** Apply the resolved theme as early as possible (imported by `main.jsx`). */
export function initTheme() {
  return applyTheme(resolveTheme())
}

export function persistTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark'
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    /* Storage unavailable (private mode, blocked cookies, …): theme still applies. */
  }
  return applyTheme(next)
}
