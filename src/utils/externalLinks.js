/** URLs that arrive in `file_path` point at external object storage. */
export function isExternalUrl(value = '') {
  return /^https?:\/\//i.test(String(value).trim())
}

/** `https://mega.co.nz/#!abc` -> `mega.co.nz` (used for the host chip). */
export function hostFromUrl(value = '') {
  try {
    return new URL(String(value)).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * Friendly storage-provider name from a host, e.g. `mega.co.nz` -> `MEGA`.
 */
export function storageProviderLabel(host = '') {
  const value = String(host).toLowerCase()
  if (!value) return 'external storage'
  if (value.includes('mega')) return 'MEGA'
  if (value.includes('drive.google') || value.includes('googleapis')) return 'Google Drive'
  if (value.includes('dropbox')) return 'Dropbox'
  if (value.includes('s3') || value.includes('amazonaws')) return 'Amazon S3'
  if (value.includes('blob.core.windows')) return 'Azure Blob Storage'
  return host
}
