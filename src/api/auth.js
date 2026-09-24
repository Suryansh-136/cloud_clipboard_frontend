import api from './client'

const AUTH_BASE = '/api/v1/auth'

/**
 * Register a new account.
 * POST /api/v1/auth/register  (JSON)  -> UserResponse
 */
export async function registerUser({ email, password }) {
  const { data } = await api.post(
    `${AUTH_BASE}/register`,
    { email, password },
    { skipAuth: true, skipAuthRedirect: true },
  )
  return data
}

/**
 * Exchange credentials for a JWT.
 * POST /api/v1/auth/login  (application/x-www-form-urlencoded: username & password)
 * -> { access_token, token_type }
 */
export async function loginUser({ email, password }) {
  const body = new URLSearchParams()
  body.append('username', email)
  body.append('password', password)

  const { data } = await api.post(`${AUTH_BASE}/login`, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    skipAuth: true,
    skipAuthRedirect: true,
  })

  return data
}

/**
 * Read the profile that belongs to the stored token.
 * GET /api/v1/auth/me  -> { id, email, is_active, created_at }
 */
export async function fetchCurrentUser({ skipAuthRedirect = true } = {}) {
  const { data } = await api.get(`${AUTH_BASE}/me`, { skipAuthRedirect })
  return data
}
