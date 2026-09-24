import axios from 'axios'

/** localStorage key required by the spec (and by the backend contract). */
export const TOKEN_STORAGE_KEY = 'token'

const FALLBACK_BASE_URL = 'https://cloud-clipboard-e1x6.onrender.com'

/** Production API base URL — override with VITE_API_BASE_URL in `.env`. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || FALLBACK_BASE_URL).replace(
  /\/+$/,
  '',
)

/**
 * The deployed backend sleeps on Render's free tier, so a cold request can take
 * ~50s. We keep a generous timeout and warn the user instead of failing early.
 */
export const REQUEST_TIMEOUT_MS = 120000

/** Fired when the backend rejects our token so the auth layer can log out. */
export const UNAUTHORIZED_EVENT = 'cloud-clipboard:unauthorized'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
})

/* ---------------------------------------------------------------- */
/* Token storage helpers                                            */
/* ---------------------------------------------------------------- */
export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeToken(token) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    /* storage can be unavailable in private mode — the app still works in-memory */
  }
}

export function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/* ---------------------------------------------------------------- */
/* Interceptors                                                     */
/* ---------------------------------------------------------------- */
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken()
    if (token && !config.skipAuth) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const skipRedirect = Boolean(error?.config?.skipAuthRedirect)

    if (status === 401 && !skipRedirect) {
      clearStoredToken()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
      }
    }

    return Promise.reject(error)
  },
)

/* ---------------------------------------------------------------- */
/* Error message extraction (FastAPI shapes)                        */
/* ---------------------------------------------------------------- */
export function extractDetail(payload) {
  if (!payload) return null
  if (typeof payload === 'string') return payload.trim() || null

  const detail = payload.detail ?? payload.message ?? payload.error
  if (!detail) return null
  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    const messages = detail
      .map((entry) => {
        if (typeof entry === 'string') return entry
        if (!entry) return null
        const location = Array.isArray(entry.loc)
          ? entry.loc.filter((part) => !['body', 'query', 'path', 'header'].includes(part)).join(' → ')
          : ''
        const message = entry.msg || entry.message || 'Invalid value'
        return location ? `${location}: ${message}` : message
      })
      .filter(Boolean)
    return messages.length ? messages.join(' • ') : null
  }

  if (typeof detail === 'object') return detail.msg || detail.message || null
  return null
}

/** Error responses requested as blobs (file downloads) still need decoding. */
async function extractBlobDetail(data) {
  if (typeof Blob === 'undefined' || !(data instanceof Blob)) return null
  try {
    const text = await data.text()
    return extractDetail(JSON.parse(text))
  } catch {
    return null
  }
}

export async function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'The server is taking too long to answer — it may be waking up from sleep. Please try again.'
  }

  if (!error.response) {
    return 'Cannot reach the server. Check your connection and try again.'
  }

  return (
    (await extractBlobDetail(error.response.data)) ||
    extractDetail(error.response.data) ||
    {
      400: 'That request was rejected. Please double-check your input.',
      401: 'Your session has expired. Please sign in again.',
      403: 'You do not have permission to do that.',
      404: 'Not found.',
      413: 'That file is too large for the server to accept.',
      422: 'Some fields are invalid. Please review and try again.',
    }[error.response.status] ||
    (error.response.status >= 500
      ? 'The server ran into a problem. Please try again in a moment.'
      : fallback)
  )
}

export function getApiErrorStatus(error) {
  return error?.response?.status ?? null
}

export default api
