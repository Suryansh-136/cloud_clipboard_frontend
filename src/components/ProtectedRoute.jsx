import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { ClaySpinner } from './ui/ClaySpinner'

function SessionLoader() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="clay-panel animate-pop rounded-clay-lg w-full max-w-sm px-8 py-10 text-center">
        <ClaySpinner label="Reconnecting your bridge…" />
        <p className="mt-4 text-xs text-clay-400">Validating your saved session token</p>
      </div>
    </div>
  )
}

/**
 * Guards private routes. While the stored token is being validated we show the
 * clay loader instead of flashing the login screen.
 */
export function ProtectedRoute({ children }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <SessionLoader />
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

export default ProtectedRoute
