import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Check, CloudDownload, Copy, ExternalLink, Trash, TriangleAlert, Type, X } from 'lucide-react'

import { downloadItemFile, downloadUrl } from '../api/items'
import { getApiErrorMessage } from '../api/client'
import { ClayBadge } from './ui/ClayBadge'
import { ClayButton } from './ui/ClayButton'
import { ClayCard } from './ui/ClayCard'
import { ClayIconBadge } from './ui/ClayIconBadge'
import { ClayProgress } from './ui/ClayProgress'
import { copyTextToClipboard } from '../utils/clipboard'
import { formatDateTime, formatRelativeTime, truncate } from '../utils/format'
import { getFileDescriptor, parseContentDisposition, saveBlob } from '../utils/files'
import { snippetPreview } from '../utils/items'

const PREVIEW_LENGTH = 320

/** One clay card per clipboard item: copy, download or delete it. */
export function ItemCard({ item, onDelete, deleting = false }) {
  const [copied, setCopied] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadPercent, setDownloadPercent] = useState(0)

  const descriptor = useMemo(
    () => getFileDescriptor(item.fileName, item.contentType),
    [item.fileName, item.contentType],
  )
  const preview = useMemo(() => snippetPreview(item.content, PREVIEW_LENGTH), [item.content])
  const externalLink = !item.isText && item.isExternalFile ? item.fileUrl : ''
  const proxyLink =
    !item.isText && !item.isExternalFile && item.filePath ? downloadUrl(item.id) : ''

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(item.content)

    if (!ok) {
      toast.error('Could not access the clipboard — try selecting the text manually.')
      return
    }

    setCopied(true)
    toast.success('Copied to clipboard!')
    window.setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = async () => {
    // Files live on external storage (MEGA in production): the share URL is the
    // only reliable download path, because the backend proxy currently 500s.
    if (item.isExternalFile && item.fileUrl) {
      window.open(item.fileUrl, '_blank', 'noopener,noreferrer')
      toast.success(`Opening the download page on ${item.fileProvider}…`)
      return
    }

    setDownloading(true)
    setDownloadPercent(0)

    try {
      const response = await downloadItemFile(item.id, {
        onDownloadProgress: (progressEvent) => {
          if (!progressEvent.total) return
          setDownloadPercent(Math.round((progressEvent.loaded / progressEvent.total) * 100))
        },
      })

      const fileName = parseContentDisposition(
        response.headers?.['content-disposition'],
        item.fileName || `item-${item.id}`,
      )

      saveBlob(response.data, fileName)
      toast.success(`Downloading ${truncate(fileName, 34)}`)
    } catch (error) {
      toast.error(await getApiErrorMessage(error, 'Could not download that file.'))
    } finally {
      setDownloading(false)
      setDownloadPercent(0)
    }
  }

  return (
    <ClayCard as="article" interactive className="flex h-full flex-col gap-4 p-5">
      <header className="flex items-start gap-3">
        <ClayIconBadge
          icon={item.isText ? Type : descriptor.Icon}
          gradient={item.isText ? 'indigo' : descriptor.tone}
          size="md"
          className="shrink-0"
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-extrabold text-clay-50" title={item.title}>
            {item.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ClayBadge tone={item.isText ? 'indigo' : descriptor.tone}>
              {item.isText ? 'Text snippet' : descriptor.label}
            </ClayBadge>
            {!item.isText && item.isExternalFile ? (
              <ClayBadge tone="mint" icon={CloudDownload} title={item.fileUrl}>
                {item.fileProvider}
              </ClayBadge>
            ) : null}
            <ClayBadge tone="slate" title={formatDateTime(item.createdAt)}>
              {formatRelativeTime(item.createdAt)}
            </ClayBadge>
          </div>
        </div>
      </header>

      {item.isText ? (
        <div className="clay-inset-sm max-h-56 overflow-auto rounded-2xl px-4 py-3">
          <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-clay-200">
            {preview || 'Empty snippet'}
          </p>
        </div>
      ) : (
        <div className="clay-inset-sm rounded-2xl px-4 py-3">
          <p className="truncate text-xs font-bold text-clay-100" title={item.fileName}>
            {item.fileName || 'Stored file'}
          </p>
          <p className="mt-1 text-[0.7rem] text-clay-400">
            {descriptor.label}
            {item.contentType && !['file', 'text'].includes(item.contentType.toLowerCase())
              ? ` · ${item.contentType}`
              : ''}
          </p>

          {externalLink ? (
            <a
              className="clay-link mt-2 inline-flex items-start gap-1.5 break-all text-[0.7rem]"
              href={externalLink}
              target="_blank"
              rel="noreferrer"
              title={externalLink}
            >
              <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              Open on {item.fileProvider}
            </a>
          ) : proxyLink ? (
            <a
              className="clay-link mt-2 inline-flex items-start gap-1.5 break-all text-[0.7rem]"
              href={proxyLink}
              target="_blank"
              rel="noreferrer"
              title="Backend download proxy"
            >
              <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              {truncate(proxyLink, 56)}
            </a>
          ) : null}
        </div>
      )}

      {downloading ? <ClayProgress value={downloadPercent} label="Downloading" /> : null}

      <footer className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {item.isText ? (
          <ClayButton
            variant={copied ? 'mint' : 'indigo'}
            size="sm"
            icon={copied ? Check : Copy}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </ClayButton>
        ) : (
          <ClayButton
            variant="violet"
            size="sm"
            icon={CloudDownload}
            loading={downloading}
            onClick={handleDownload}
            title={
              item.isExternalFile
                ? `Opens the ${item.fileProvider} download page`
                : 'Download through the backend proxy'
            }
          >
            Download
          </ClayButton>
        )}

        <div className="ml-auto flex items-center gap-2">
          {confirmingDelete ? (
            <>
              <ClayButton
                variant="rose"
                size="sm"
                icon={Trash}
                loading={deleting}
                onClick={() => {
                  setConfirmingDelete(false)
                  // The feed owns the request and deletes by id.
                  onDelete?.(item.id)
                }}
              >
                Confirm
              </ClayButton>
              <ClayButton
                variant="ghost"
                size="icon-sm"
                icon={X}
                onClick={() => setConfirmingDelete(false)}
                title="Keep item"
                aria-label="Keep item"
              />
            </>
          ) : (
            <ClayButton
              variant="ghost"
              size="sm"
              icon={Trash}
              disabled={deleting}
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </ClayButton>
          )}
        </div>
      </footer>

      {confirmingDelete ? (
        <p className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-rose-300">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          This permanently removes the item from your bridge.
        </p>
      ) : null}
    </ClayCard>
  )
}

export default ItemCard
