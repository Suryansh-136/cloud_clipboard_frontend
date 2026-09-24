import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { applyTheme, getStoredTheme, getSystemTheme, persistTheme, resolveTheme } from '../theme'

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} })

/** Tracks the active theme and keeps `<html data-theme>` in sync. */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => resolveTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const handleChange = () => {
      // Respect an explicit manual choice; only follow the OS while on "system".
      if (!getStoredTheme()) setTheme(getSystemTheme())
    }
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handleChange)
      return () => media.removeEventListener('change', handleChange)
    }
    if (typeof media.addListener === 'function') {
      media.addListener(handleChange)
      return () => media.removeListener(handleChange)
    }
    return undefined
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((previous) => persistTheme(previous === 'light' ? 'dark' : 'light'))
  }, [])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}

export default ThemeProvider
