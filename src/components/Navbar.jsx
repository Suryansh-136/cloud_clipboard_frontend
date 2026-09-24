import { useNavigate } from 'react-router-dom'
import { CircleUser, Clock, CloudLightning, LogOut, Moon, RefreshCw, Sun } from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { ClayBadge } from './ui/ClayBadge'
import { ClayButton } from './ui/ClayButton'
import { ClayIconBadge } from './ui/ClayIconBadge'
import { formatRelativeTime } from '../utils/format'

/** Sticky clay navbar: brand badge, signed-in email badge and a logout button. */
export function Navbar({ counts, lastSyncedAt, onRefresh, refreshing = false }) {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const isLight = theme === 'light'

  const handleLogout = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-clay-900/70 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <ClayIconBadge icon={CloudLightning} gradient="indigo" size="md" />
          <div className="min-w-0">
            <p className="clay-text-gradient truncate text-base font-extrabold sm:text-lg">
              Cloud ClipBoard
            </p>
            <p className="hidden text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-clay-400 sm:block">
              Personal Digital Bridge
            </p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {counts ? (
            <ClayBadge tone="violet" icon={Clock} className="hidden sm:inline-flex">
              {counts.total} saved
            </ClayBadge>
          ) : null}

          {lastSyncedAt ? (
            <span className="hidden text-[0.7rem] text-clay-400 lg:block">
              synced {formatRelativeTime(lastSyncedAt.toISOString())}
            </span>
          ) : null}

          {onRefresh ? (
            <ClayButton
              variant="ghost"
              size="icon-sm"
              icon={RefreshCw}
              onClick={onRefresh}
              loading={refreshing}
              title="Refresh items"
              aria-label="Refresh items"
            />
          ) : null}

          <ClayButton
            variant="ghost"
            size="icon-sm"
            icon={isLight ? Moon : Sun}
            onClick={toggleTheme}
            title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-pressed={isLight}
          />

          <ClayBadge
            tone="indigo"
            icon={CircleUser}
            className="max-w-[11rem]"
            title={user?.email || 'Signed in'}
          >
            {user?.email || 'Signed in'}
          </ClayBadge>

          <ClayButton variant="rose" size="sm" icon={LogOut} onClick={handleLogout}>
            Logout
          </ClayButton>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
