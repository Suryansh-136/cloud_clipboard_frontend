import { Moon, Sun } from 'lucide-react'

import { useTheme } from '../context/ThemeContext'
import { ClayButton } from './ui/ClayButton'

/** Shared light/dark control used in both the auth pages and dashboard navbar. */
export function ThemeToggleButton({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'
  const label = isLight ? 'Switch to dark mode' : 'Switch to light mode'

  return (
    <ClayButton
      variant="ghost"
      size="icon-sm"
      icon={isLight ? Moon : Sun}
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      aria-pressed={isLight}
      className={`shrink-0 ${className}`}
    />
  )
}

export default ThemeToggleButton
