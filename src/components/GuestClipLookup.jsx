import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  Check,
  CloudDownload,
  Copy,
  ExternalLink,
  FileText,
  Inbox,
  KeyRound,
  Search,
  Type,
  X,
} from 'lucide-react'

import { getApiErrorMessage, getApiErrorStatus } from '../api/client'
import { fetchPublicClips } from '../api/publicClips'
import { copyTextToClipboard } from '../utils/clipboard'
import { formatRelativeTime } from '../utils/format'
import { ClayBadge } from './ui/ClayBadge'
import { ClayButton } from './ui/ClayButton'
import { ClayIconBadge } from './ui/ClayIconBadge'
import { ClayInput } from './ui/ClayField'

/**
 * Guard rails for the guest lookup: the live backend answers a bad key with
 * HTTP 404 (`Invalid or expired share key`); older builds answered 500. Both
 * are treated as an invalid key so the guest message stays friendly.
 */
const INVALID_KEY_STATUSES = new Set([400, 404, 410, 422, 500])

export function guestClipErrorMessage(error) {
  const status = getApiErrorStatus(error)
  if (status && INVALID_KEY_STATUSES.has(status)) {
    return 'Invalid Share Key. Check the key and try again.'
  }

  return getApiErrorMessage(error, 'Could not load these clips. Please try again.')
}

/** Copyable payload for a clip: snippet body, or the file URL for uploads. */
function clipCopyValue(clip) {
  return clip?.isText ? clip.content : clip?.fileUrl || ''
}

/** Presentational result list, exported so tests can render it directly. */
export function GuestClipResults({ clips = [], copiedId = null, onCopy }) {
  if (!clips.length) return null

  return (
    <div className="space-y-3">
      {clips.map((clip, index) => {
        const copyValue = clipCopyValue(clip)
        const copyKey = clip.id ?? `${clip.title}-${index}`
        const copied = copiedId === copyKey

        return (
          <article key={copyKey} className="clay-card clay-card-hover rounded-3xl p-4">
            <div className="flex flex-wrap items-center gap-2">
              <ClayBadge tone={clip.isText ? 'indigo' : 'mint'} icon={clip.isText ? Type : FileText}>
                {clip.isText ? 'Text snippet' : 'File'}
              </ClayBadge>

              {clip.createdAt ? (
                <span className="text-[0.7rem] text-clay-400">{formatRelativeTime(clip.createdAt)}</span>
              ) : null}
            </div>

            <h4 className="mt-3 break-words text-sm font-bold text-clay-100">{clip.title}</h4>

            {clip.isText ? (
              <p className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-clay-200">
                {clip.content}
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                <p className="truncate text-xs text-clay-300" title={clip.fileName}>
                  {clip.fileName}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {clip.fileProvider ? <ClayBadge tone="violet">{clip.fileProvider}</ClayBadge> : null}
                  {clip.fileUrl ? (
                    <a
                      className="clay-link inline-flex items-center gap-1 text-xs"
                      href={clip.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open file
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </div>
            )}

            {copyValue ? (
              <ClayButton
                variant="ghost"
                size="sm"
                icon={copied ? Check : Copy}
                onClick={() => onCopy?.(clip, copyKey)}
                className="mt-4"
                aria-label={copied ? 'Copied!' : clip.isText ? 'Copy Text' : 'Copy Link'}
              >
                {copied ? 'Copied!' : clip.isText ? 'Copy Text' : 'Copy Link'}
              </ClayButton>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

/**
 * Guest credential lookup shown on the login page. It never navigates or
 * reloads: results render inline and "Clear / Back" collapses the panel.
 */
export function GuestClipLookup({ onClose, className = '' }) {
  const [shareKey, setShareKey] = useState('')
  const [clips, setClips] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  const reset = () => {
    setShareKey('')
    setClips([])
    setLoading(false)
    setError('')
    setSearched(false)
    setCopiedId(null)
    onClose?.()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading) return

    const key = shareKey.trim()
    if (!key) {
      setError('Enter a share key to continue.')
      setClips([])
      setSearched(false)
      return
    }

    setLoading(true)
    setError('')
    setSearched(false)
    setCopiedId(null)

    try {
      const next = await fetchPublicClips(key)
      setClips(next)
      setSearched(true)
      if (next.length) {
        toast.success(`Loaded ${next.length} ${next.length === 1 ? 'clip' : 'clips'}!`)
      }
    } catch (requestError) {
      setClips([])
      setError(guestClipErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (clip, copyKey) => {
    const ok = await copyTextToClipboard(clipCopyValue(clip))
    if (!ok) {
      toast.error('Could not copy to the clipboard.')
      return
    }

    setCopiedId(copyKey)
    toast.success('Copied to clipboard!')
    window.setTimeout(() => setCopiedId((current) => (current === copyKey ? null : current)), 2200)
  }

  const showReset = Boolean(clips.length || searched || error)

  return (
    <div className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClayIconBadge icon={KeyRound} gradient="violet" size="sm" className="shrink-0" />
          <div>
            <h3 className="text-sm font-extrabold text-clay-50">Guest Access</h3>
            <p className="text-xs text-clay-400">Open shared clips with a key — no sign-in needed.</p>
          </div>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to sign in"
            className="text-clay-400 transition hover:text-clay-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
        <ClayInput
          id="shareKey"
          label="Enter Share Key"
          icon={KeyRound}
          placeholder="clip…"
          autoComplete="off"
          spellCheck="false"
          value={shareKey}
          onChange={(event) => {
            setShareKey(event.target.value)
            if (error) setError('')
          }}
          error={error}
        />

        <ClayButton type="submit" variant="mint" size="lg" icon={Search} loading={loading} className="w-full">
          View Clips
        </ClayButton>
      </form>

      <div className="mt-4 space-y-3" aria-live="polite">
        {loading ? <p role="status" className="text-center text-xs text-clay-400">Looking for clips…</p> : null}

        {!loading && searched && clips.length === 0 && !error ? (
          <div className="clay-inset-sm flex items-center gap-3 rounded-2xl px-4 py-3 text-xs text-clay-300">
            <Inbox className="h-4 w-4 shrink-0" aria-hidden="true" />
            No clips found for that key.
          </div>
        ) : null}

        {!loading && clips.length ? (
          <>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-clay-400">
              {clips.length} {clips.length === 1 ? 'clip' : 'clips'} found
            </p>
            <GuestClipResults clips={clips} copiedId={copiedId} onCopy={handleCopy} />
          </>
        ) : null}

        {showReset && !loading ? (
          <ClayButton variant="ghost" size="sm" icon={X} onClick={reset} className="w-full">
            Clear / Back
          </ClayButton>
        ) : null}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[0.68rem] text-clay-500">
        <CloudDownload className="h-3.5 w-3.5" aria-hidden="true" />
        Shared files open on their storage provider.
      </p>
    </div>
  )
}

export default GuestClipLookup

