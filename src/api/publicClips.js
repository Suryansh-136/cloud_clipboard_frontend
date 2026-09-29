import api from './client'
import { normalizeItems } from '../utils/items'

/**
 * The deployed backend exposes the guest lookup as
 *   GET /api/v1/items/public/{share_key}  -> ItemOut[]
 * (verified against the live OpenAPI document), and unlike the requested
 * `/api/v1/public/clips/{key}` path it actually exists in production.
 */
export const publicClipsPath = (shareKey) =>
  `/api/v1/items/public/${encodeURIComponent(String(shareKey ?? '').trim())}`

/** Rows may arrive as a bare array or wrapped; accept every known shape. */
function rowsFromPayload(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.clips)) return data.clips
  if (Array.isArray(data?.items)) return data.items
  return []
}

/**
 * Unauthenticated guest lookup. `skipAuth` keeps the request free of the
 * Authorization header even if a stale token is still in localStorage.
 */
export async function fetchPublicClips(shareKey) {
  const key = String(shareKey ?? '').trim()
  if (!key) throw new Error('Enter a share key.')

  const { data } = await api.get(publicClipsPath(key), {
    skipAuth: true,
    skipAuthRedirect: true,
  })

  return normalizeItems(rowsFromPayload(data))
}
