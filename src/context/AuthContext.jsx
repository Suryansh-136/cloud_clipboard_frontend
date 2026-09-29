import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import {
  UNAUTHORIZED_EVENT,
  clearStoredToken,
  getApiErrorMessage,
  getStoredToken,
  storeToken,
} from '../api/client'
import { fetchCurrentUser, loginUser, registerUser } from '../api/auth'

const AuthContext = createContext(null)

/**
 * Owns the JWT lifecycle: restore on boot, persist in localStorage under the
 * `token` key, refresh the profile and react to 401s raised by axios.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken())
  const [user, setUser] = useState(null)
  // loading -> we have a token and are validating it; anonymous | authenticated
  const [status, setStatus] = useState(() => (getStoredToken() ? 'loading' : 'anonymous'))
  const restoredRef = useRef(false)

  const resetSession = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
    setStatus('anonymous')
  }, [])

  const reloadProfile = useCallback(async () => {
    const profile = await fetchCurrentUser()
    setUser(profile)
    return profile
  }, [])

  /**
   * Merge a patch into the cached profile (for example the share key returned by
   * `POST /auth/generate_share_key`, which `/auth/me` does not expose).
   */
  const updateUser = useCallback((patch) => {
    setUser((previous) => (previous ? { ...previous, ...patch } : previous))
  }, [])
  const signOut = useCallback(
    ({ silent = false } = {}) => {
      resetSession()
      if (!silent) toast.success('Signed out — see you soon!')
    },
    [resetSession],
  )

  /* Restore the session once on boot (guarded against StrictMode double-run) */
  useEffect(() => {
    if (restoredRef.current) return undefined
    restoredRef.current = true

    const stored = getStoredToken()
    if (!stored) {
      setStatus('anonymous')
      return undefined
    }

    let cancelled = false
    setStatus('loading')

    const bootstrap = async () => {
      try {
        const profile = await fetchCurrentUser()
        if (cancelled) return
        setUser(profile)
        setStatus('authenticated')
      } catch (error) {
        if (cancelled) return
        resetSession()
        if (error?.response?.status === 401) {
          toast.error('Your session expired. Please sign in again.')
        }
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [resetSession])

  /* The axios interceptor fires this when any request is rejected with 401 */
  useEffect(() => {
    const handleUnauthorized = () => {
      resetSession()
      toast.error('Your session expired. Please sign in again.')
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [resetSession])

  const signIn = useCallback(
    async ({ email, password }) => {
      const data = await loginUser({ email, password })
      const accessToken = data?.access_token

      if (!accessToken) {
        throw new Error('The server did not return an access token.')
      }

      storeToken(accessToken)
      setToken(accessToken)
      setStatus('authenticated')

      try {
        await reloadProfile()
      } catch {
        // The token is valid even if the profile call hiccups (cold start).
      }

      return data
    },
    [reloadProfile],
  )

  const signUp = useCallback(
    async ({ email, password }) => {
      await registerUser({ email, password })
      // Registration returns 201 + the new user, so log straight in.
      return signIn({ email, password })
    },
    [signIn],
  )

  const value = useMemo(
    () => ({
      token,
      user,
      status,
      isAuthenticated: status === 'authenticated',
      signIn,
      signUp,
      signOut,
      reloadProfile,
      updateUser,
      getErrorMessage: getApiErrorMessage,
    }),
    [token, user, status, signIn, signUp, signOut, reloadProfile, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth() must be used inside an <AuthProvider>')
  }
  return context
}

export default AuthProvider
