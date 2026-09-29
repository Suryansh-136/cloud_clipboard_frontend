import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Check, Copy, KeyRound } from 'lucide-react'

import { generateShareKey } from '../api/auth'
import { getApiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { copyTextToClipboard } from '../utils/clipboard'
import { ClayBadge } from './ui/ClayBadge'
import { ClayButton } from './ui/ClayButton'
import { ClayIconBadge } from './ui/ClayIconBadge'
import { ClayInput } from './ui/ClayField'

/**
 * GET /auth/me does not return share_key (only POST /auth/generate_share_key
 * does), so the last key minted by this browser is remembered per user. Without
 * that cache a reload would show "Generate" again and clicking it would rotate
 * the key, breaking links that were already shared.
 */
const storageKeyFor = (user) => (user?.id != null ? 'cloud-clipboard:share_key:' + user.id : null)

function readStoredShareKey(user) {
  const storageKey = storageKeyFor(user)
  if (!storageKey) return ''
  try {
    return localStorage.getItem(storageKey) || ''
  } catch {
    return ''
  }
}

function writeStoredShareKey(user, shareKey) {
  const storageKey = storageKeyFor(user)
  if (!storageKey) return
  try {
    localStorage.setItem(storageKey, shareKey)
  } catch {
    /* storage can be unavailable in private mode - the widget still works in memory */
  }
}

/** Read-only key field + copy action, exported so tests can assert it. */
export function ShareLinkKeyField({ shareKey, copied = false, onCopy }) {
  return (
    <div className="space-y-3">
      <ClayInput
        id="publicShareKey"
        label="Your share key"
        value={shareKey}
        readOnly
        onFocus={(event) => (event.target.select())}
        className="text-center font-mono text-sm tracking-[0.2em]"
      />

      <ClayButton
        variant="mint"
        size="md"
        icon={copied ? Check : Copy}
        onClick={onCopy}
        className="w-full"
      >
        {copied ? 'Copied!' : 'Copy Key'}
      </ClayButton>

      <p className="text-xs leading-relaxed text-clay-400">
        Paste this key under <span className="font-semibold text-clay-200">Guest Access</span> on the
        login page to share these clips without an account.
      </p>

      <p role="status" aria-live="polite" className="sr-only">
        {copied ? 'Copied!' : ''}
      </p>
    </div>
  )
}

/** Public Share Link card: generate a share key and copy it for guests. */
export function ShareLinkWidget() {
  const { user, updateUser } = useAuth()
  const [shareKey, setShareKey] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const activeKey = user?.share_key || shareKey

  /* Adopt a key returned by /auth/me or restored from this browser's cache. */
  useEffect(() => {
    if (!user) return
    const stored = readStoredShareKey(user)

    if (user.share_key) {
      if (stored !== user.share_key) writeStoredShareKey(user, user.share_key)
      setShareKey(user.share_key)
      return
    }

    if (stored) {
      setShareKey(stored)
      updateUser({ share_key: stored })
    }
  }, [user?.id, user?.share_key, updateUser])

  const handleGenerate = async () => {
    if (generating) return

    setGenerating(true)
    setError('')

    try {
      const data = await generateShareKey()
      const key = typeof data?.share_key === 'string' ? data.share_key : ''

      if (!key) throw new Error('The server did not return a share key.')

      setShareKey(key)
      updateUser({ share_key: key })
      writeStoredShareKey(user, key)
      toast.success('Public share key generated!')
    } catch (requestError) {
      const message = requestError?.response
        ? await getApiErrorMessage(requestError, 'Could not generate a share key.')
        : requestError.message
      setError(message)
      toast.error(message)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(activeKey)
    if (!ok) {
      toast.error('Could not copy to the clipboard.')
      return
    }

    setCopied(true)
    toast.success('Share key copied!')
    window.setTimeout(() => (setCopied(false)), 2200)
  }

  return (
    <section className="clay-panel rounded-clay animate-pop p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <ClayIconBadge icon={KeyRound} gradient="sky" size="md" />
        <div className="min-w-0">
          <h2 className="text-sm font-extrabold text-clay-50">Public Share Link</h2>
          <p className="truncate text-xs text-clay-400">Let guests read your clips without an account.</p>
        </div>
      </div>

      {activeKey ? (
        <div className="mt-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <ClayBadge tone="mint">Active</ClayBadge>
            <span className="text-[0.7rem] text-clay-400">
              {activeKey.length} characters
            </span>
          </div>

          <ShareLinkKeyField shareKey={activeKey} copied={copied} onCopy={handleCopy} />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-xs leading-relaxed text-clay-300">
            Generate a public key so anyone can view your clips from the login page - no sign-in
            needed. Keep it private: anyone with the key can read this bridge.
          </p>

          {error ? (
            <p role="alert" className="clay-inset-sm rounded-2xl px-4 py-3 text-xs font-semibold text-rose-200">
              {error}
            </p>
          ) : null}

          <ClayButton
            variant="indigo"
            size="md"
            icon={KeyRound}
            loading={generating}
            onClick={handleGenerate}
            className="w-full"
          >
            {generating ? 'Generating...' : 'Generate Public Key'}
          </ClayButton>
        </div>
      )}
    </section>
  )
}

export default ShareLinkWidget