import { isExternalUrl, hostFromUrl, storageProviderLabel } from './externalLinks'
import { basename } from './files'
import { truncate } from './format'

/**
 * The backend `ItemResponse` is:
 *   { id, user_id, content_type, text_payload, file_path, created_at }
 *
 * Verified against the live API:
 *   - text snippets  -> content_type "text", text_payload = body, file_path = null
 *   - uploaded files -> content_type "file", text_payload = the optional title,
 *     file_path = an external storage share URL (MEGA in production). The
 *     original file name is NOT persisted, so the title doubles as the name.
 *
 * This module normalises both flavours into one predictable shape for the UI.
 */

const TEXT_CONTENT_HINTS = ['text', 'snippet', 'note', 'plain']

/** First meaningful line of a snippet, used when there is no title. */
function deriveTextTitle(text) {
  const firstLine = String(text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0)

  if (!firstLine) return 'Untitled snippet'
  return truncate(firstLine, 64)
}

/** Last path segment when it looks like a file name, otherwise nothing. */
function nameFromUrl(url = '') {
  try {
    const { pathname } = new URL(url)
    const candidate = decodeURIComponent(pathname.split('/').filter(Boolean).pop() || '')
    return /\.[a-z0-9]{1,8}$/i.test(candidate) ? candidate : ''
  } catch {
    return ''
  }
}

export function normalizeItem(row = {}) {
  const contentType = String(row.content_type ?? '')
  const filePath = typeof row.file_path === 'string' ? row.file_path : ''
  const payload = typeof row.text_payload === 'string' ? row.text_payload.trim() : ''
  const isText =
    !filePath &&
    (payload.length > 0 ||
      TEXT_CONTENT_HINTS.some((hint) => contentType.toLowerCase().includes(hint)))

  const fileUrl = isText ? '' : filePath
  const isExternalFile = isExternalUrl(fileUrl)
  const fileHost = isExternalFile ? hostFromUrl(fileUrl) : ''
  // Storage URLs rarely carry the file name (MEGA shares are hashes), so the
  // upload title stored in `text_payload` is the best label we have.
  const fileName = isText
    ? ''
    : payload || nameFromUrl(fileUrl) || (isExternalFile ? '' : basename(fileUrl)) || 'Untitled file'
  const explicitTitle = typeof row.title === 'string' ? row.title.trim() : ''

  return {
    id: row.id,
    userId: row.user_id,
    isText,
    title: explicitTitle || (isText ? deriveTextTitle(payload) : fileName),
    hasExplicitTitle: Boolean(explicitTitle),
    content: isText ? payload : '',
    fileName,
    filePath,
    fileUrl,
    isExternalFile,
    fileHost,
    fileProvider: isExternalFile ? storageProviderLabel(fileHost) : '',
    contentType,
    createdAt: row.created_at,
    raw: row,
  }
}

export function normalizeItems(rows) {
  if (!Array.isArray(rows)) return []

  return rows
    .map(normalizeItem)
    .sort((a, b) => {
      const left = a.raw?.created_at ? Date.parse(a.raw.created_at) : 0
      const right = b.raw?.created_at ? Date.parse(b.raw.created_at) : 0
      return right - left
    })
}

/** Collapse whitespace so previews never render ragged empty lines. */
export function snippetPreview(content, maxLength = 280) {
  const text = String(content ?? '').replace(/\s+/g, ' ').trim()
  return truncate(text, maxLength)
}

/** Text items are copied verbatim; file items cannot be copied as text. */
export function canCopyItem(item) {
  return Boolean(item?.isText && item.content)
}
