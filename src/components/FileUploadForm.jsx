import { useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { CloudUpload, FolderDown, X } from 'lucide-react'

import { getApiErrorMessage } from '../api/client'
import { uploadFileItem } from '../api/items'
import { ClayButton } from './ui/ClayButton'
import { ClayInput } from './ui/ClayField'
import { ClayProgress } from './ui/ClayProgress'
import { formatBytes, truncate } from '../utils/format'
import { getFileDescriptor } from '../utils/files'

const MAX_TITLE_LENGTH = 120
/** Soft guard rail — the backend decides the real limit. */
const SOFT_SIZE_LIMIT = 100 * 1024 * 1024

export function FileUploadForm({ onCreated }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const descriptor = useMemo(
    () => (file ? getFileDescriptor(file.name, file.type) : null),
    [file],
  )

  const acceptFile = (candidate) => {
    if (!candidate) return

    if (candidate.size > SOFT_SIZE_LIMIT) {
      const message = `“${truncate(candidate.name, 40)}” is ${formatBytes(
        candidate.size,
      )} — try something under ${formatBytes(SOFT_SIZE_LIMIT, 0)}.`
      setError(message)
      toast.error(message)
      return
    }

    setFile(candidate)
    setError(null)
    setProgress(0)
    // The backend stores the upload `title` in `text_payload` and never keeps the
    // original file name, so prefill the title with the full name (extension
    // included) to preserve it in the feed.
    if (!title) setTitle(candidate.name)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    acceptFile(event.dataTransfer?.files?.[0])
  }

  const reset = () => {
    setFile(null)
    setTitle('')
    setProgress(0)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleUpload = async (event) => {
    event.preventDefault()
    if (uploading) return

    if (!file) {
      setError('Choose a file to upload first.')
      toast.error('Choose a file to upload first.')
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const row = await uploadFileItem({
        file,
        title: title.trim(),
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return
          setProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100))
        },
      })

      onCreated?.(row)
      toast.success(`Uploaded “${truncate(file.name, 32)}”`)
      reset()
    } catch (uploadError) {
      const message = await getApiErrorMessage(uploadError, 'Upload failed. Please try again.')
      setError(message)
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleUpload} noValidate>
      <ClayInput
        id="file-title"
        label="Title"
        placeholder="Quarterly report, holiday photos…"
        icon={CloudUpload}
        maxLength={MAX_TITLE_LENGTH}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        hint="Optional — helps you recognise the file in the feed."
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragging(false)
        }}
        onDrop={handleDrop}
        aria-label="Choose a file or drop it here"
        className={`clay-dropzone flex cursor-pointer flex-col items-center gap-3 px-6 py-9 text-center ${
          dragging ? 'clay-dropzone-active' : ''
        }`}
      >
        <span
          className={`clay-icon-badge h-16 w-16 bg-linear-to-br transition ${
            dragging
              ? 'from-mint to-mint-deep text-emerald-950'
              : 'from-clay-600 to-clay-800 text-indigo-200'
          }`}
        >
          <CloudUpload className="h-7 w-7" aria-hidden="true" />
        </span>

        <p className="text-sm font-bold text-clay-100">
          {dragging ? 'Release to stage the file' : 'Drag & drop a file here'}
        </p>
        <p className="text-xs text-clay-400">or click to browse — one file at a time</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => acceptFile(event.target.files?.[0])}
      />

      {file && descriptor ? (
        <div className="clay-inset-sm animate-pop flex items-center gap-3 rounded-2xl px-4 py-3">
          <span className={`clay-icon-badge h-10 w-10 ${descriptor.tones.badge}`}>
            <descriptor.Icon className="h-5 w-5" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-clay-100" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-clay-400">
              {descriptor.label} · {formatBytes(file.size)}
            </p>
          </div>

          <ClayButton
            variant="ghost"
            size="icon-sm"
            icon={X}
            onClick={reset}
            disabled={uploading}
            title="Remove file"
            aria-label="Remove file"
          />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="px-1 text-xs font-semibold text-rose-300">
          {error}
        </p>
      ) : null}

      {file && (uploading || progress > 0) ? (
        <ClayProgress
          value={progress}
          label={uploading ? 'Uploading' : 'Upload complete'}
          detail={`${formatBytes((file.size * progress) / 100)} of ${formatBytes(file.size)}`}
          tone={progress >= 100 ? 'mint' : 'default'}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-clay-400">
          <FolderDown className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
          Files stream straight to your bridge — nothing is kept in this browser.
        </p>

        <ClayButton
          type="submit"
          variant="mint"
          size="lg"
          icon={CloudUpload}
          loading={uploading}
          disabled={!file}
        >
          Upload File
        </ClayButton>
      </div>
    </form>
  )
}

export default FileUploadForm
