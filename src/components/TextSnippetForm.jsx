import { useState } from 'react'
import toast from 'react-hot-toast'
import { Save, Sparkles, Type } from 'lucide-react'

import { getApiErrorMessage } from '../api/client'
import { createTextItem } from '../api/items'
import { ClayButton } from './ui/ClayButton'
import { ClayInput, ClayTextarea } from './ui/ClayField'
import { countWords } from '../utils/format'

const MAX_CONTENT_LENGTH = 20000
const MAX_TITLE_LENGTH = 120

/**
 * Saves a text snippet through POST /api/v1/items/.
 * The backend has no title column, so the title travels as an extra property
 * and the feed falls back to the snippet's first line when it is missing.
 */
export function TextSnippetForm({ onCreated }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return

    const next = {}
    const trimmedContent = content.trim()
    const trimmedTitle = title.trim()

    if (!trimmedContent) next.content = 'Type or paste something to save.'
    else if (trimmedContent.length < 2) next.content = 'That snippet is a little too short.'
    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      next.title = `Keep the title under ${MAX_TITLE_LENGTH} characters.`
    }

    setErrors(next)

    if (Object.keys(next).length > 0) {
      toast.error('Please review the highlighted field.')
      return
    }

    setSaving(true)

    try {
      const row = await createTextItem({ title: trimmedTitle, content: trimmedContent })
      onCreated?.(row)
      setTitle('')
      setContent('')
      setErrors({})
      toast.success('Snippet saved to your clipboard!')
    } catch (error) {
      toast.error(await getApiErrorMessage(error, 'Could not save that snippet.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <ClayInput
        id="snippet-title"
        label="Title"
        placeholder="Deploy checklist, Wi-Fi password, SQL snippet…"
        icon={Type}
        maxLength={MAX_TITLE_LENGTH}
        value={title}
        onChange={(event) => {
          setTitle(event.target.value)
          setErrors((previous) => ({ ...previous, title: undefined }))
        }}
        error={errors.title}
        hint="Optional — the API stores snippets without a title, so we label them by their first line."
      />

      <ClayTextarea
        id="snippet-content"
        label="Snippet"
        placeholder="Paste or type anything you want to reach from another device…"
        rows={7}
        maxLength={MAX_CONTENT_LENGTH}
        value={content}
        onChange={(event) => {
          setContent(event.target.value)
          setErrors((previous) => ({ ...previous, content: undefined }))
        }}
        error={errors.content}
        footer={
          content
            ? `${countWords(content)} words · ${content.length} characters`
            : 'Ctrl/⌘ + V works great here.'
        }
        required
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-clay-400">
          <Sparkles className="h-3.5 w-3.5 text-indigo-300" aria-hidden="true" />
          Stored on your personal bridge, private to your account.
        </p>

        <ClayButton type="submit" variant="indigo" size="lg" icon={Save} loading={saving}>
          Save Snippet
        </ClayButton>
      </div>
    </form>
  )
}

export default TextSnippetForm
