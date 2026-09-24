import api, { API_BASE_URL } from './client'

const ITEMS_BASE = '/api/v1/items'

/**
 * Sentinel content types used by this client for text snippets. The backend
 * only requires a non-empty `content_type` string, so the frontend also
 * recognises the MIME-ish variants in case they are returned instead.
 */
export const TEXT_CONTENT_TYPE = 'text'

/**
 * The deployed backend mounts the download route as
 * `/api/v1/items/api/v1/items/{id}/download` (verified against the live
 * OpenAPI document) and it does not require an Authorization header.
 */
export const downloadPath = (itemId) => `${ITEMS_BASE}/api/v1/items/${encodeURIComponent(itemId)}/download`

/** Absolute, shareable download URL (used for the card's proxy link). */
export const downloadUrl = (itemId) => `${API_BASE_URL}${downloadPath(itemId)}`

/**
 * GET /api/v1/items/  -> ItemResponse[]
 */
export async function fetchItems() {
  const { data } = await api.get(`${ITEMS_BASE}/`)
  return Array.isArray(data) ? data : []
}

/**
 * POST /api/v1/items/  (JSON: { content_type, text_payload })
 *
 * `title` is not part of the backend schema — it is sent as an extra property
 * (harmless, and future-proof if the API starts persisting it). The UI derives
 * a title from the snippet itself when the row comes back without one.
 */
export async function createTextItem({ title, content }) {
  const payload = {
    content_type: TEXT_CONTENT_TYPE,
    text_payload: content,
  }

  if (title && title.trim()) {
    payload.title = title.trim()
  }

  const { data } = await api.post(`${ITEMS_BASE}/`, payload)
  return data
}

/**
 * POST /api/v1/items/upload  (multipart/form-data: file, optional title)
 */
export async function uploadFileItem({ file, title, onUploadProgress }) {
  const form = new FormData()
  form.append('file', file)
  if (title && title.trim()) {
    form.append('title', title.trim())
  }

  const { data } = await api.post(`${ITEMS_BASE}/upload`, form, {
    // Large uploads deserve a longer leash than the default JSON timeout.
    timeout: 300000,
    onUploadProgress,
  })

  return data
}

/**
 * GET .../{item_id}/download  -> Blob (raw response so headers stay available)
 *
 * NOTE: production deployments that back files with external storage currently
 * answer this proxy with HTTP 500, which is why `ItemCard` prefers the stored
 * share URL (`file_path`) and only falls back to this proxy.
 */
export async function downloadItemFile(itemId, { onDownloadProgress } = {}) {
  return api.get(downloadPath(itemId), {
    responseType: 'blob',
    timeout: 300000,
    onDownloadProgress,
    skipAuthRedirect: true,
  })
}

/**
 * DELETE /api/v1/items/{item_id}
 */
export async function deleteItem(itemId) {
  const { data } = await api.delete(`${ITEMS_BASE}/${encodeURIComponent(itemId)}`)
  return data
}
