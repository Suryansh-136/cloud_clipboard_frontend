import {
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Presentation,
  ShieldCheck,
} from 'lucide-react'

/**
 * Tailwind class recipes per accent so file cards can colour-code themselves.
 * (Tailwind v4 gradient utility name: `bg-linear-to-br`.)
 */
const TONES = {
  indigo: {
    badge: 'bg-linear-to-br from-indigo-clay to-indigo-deep text-white',
    text: 'text-indigo-300',
  },
  mint: {
    badge: 'bg-linear-to-br from-mint to-mint-deep text-emerald-950',
    text: 'text-emerald-300',
  },
  violet: {
    badge: 'bg-linear-to-br from-violet-clay to-violet-deep text-white',
    text: 'text-violet-300',
  },
  amber: {
    badge: 'bg-linear-to-br from-amber-clay to-orange-600 text-amber-950',
    text: 'text-amber-300',
  },
  sky: {
    badge: 'bg-linear-to-br from-sky-clay to-blue-600 text-white',
    text: 'text-sky-300',
  },
  rose: {
    badge: 'bg-linear-to-br from-rose-clay to-rose-deep text-white',
    text: 'text-rose-300',
  },
  slate: {
    badge: 'bg-linear-to-br from-clay-500 to-clay-700 text-white',
    text: 'text-clay-300',
  },
}

const EXTENSION_MAP = {
  pdf: { Icon: FileText, tone: 'rose', label: 'PDF document' },
  doc: { Icon: FileText, tone: 'sky', label: 'Word document' },
  docx: { Icon: FileText, tone: 'sky', label: 'Word document' },
  odt: { Icon: FileText, tone: 'sky', label: 'OpenDocument text' },
  txt: { Icon: FileText, tone: 'slate', label: 'Text file' },
  md: { Icon: FileText, tone: 'slate', label: 'Markdown file' },
  rtf: { Icon: FileText, tone: 'slate', label: 'Rich text file' },
  log: { Icon: FileText, tone: 'slate', label: 'Log file' },
  csv: { Icon: FileSpreadsheet, tone: 'mint', label: 'CSV spreadsheet' },
  xls: { Icon: FileSpreadsheet, tone: 'mint', label: 'Excel spreadsheet' },
  xlsx: { Icon: FileSpreadsheet, tone: 'mint', label: 'Excel spreadsheet' },
  ppt: { Icon: Presentation, tone: 'amber', label: 'Presentation' },
  pptx: { Icon: Presentation, tone: 'amber', label: 'Presentation' },
  pem: { Icon: ShieldCheck, tone: 'mint', label: 'Certificate' },
  key: { Icon: ShieldCheck, tone: 'mint', label: 'Key file' },
  png: { Icon: FileImage, tone: 'violet', label: 'Image' },
  jpg: { Icon: FileImage, tone: 'violet', label: 'Image' },
  jpeg: { Icon: FileImage, tone: 'violet', label: 'Image' },
  gif: { Icon: FileImage, tone: 'violet', label: 'Image' },
  webp: { Icon: FileImage, tone: 'violet', label: 'Image' },
  svg: { Icon: FileImage, tone: 'violet', label: 'Vector image' },
  bmp: { Icon: FileImage, tone: 'violet', label: 'Image' },
  ico: { Icon: FileImage, tone: 'violet', label: 'Icon' },
  mp3: { Icon: FileAudio, tone: 'amber', label: 'Audio track' },
  wav: { Icon: FileAudio, tone: 'amber', label: 'Audio track' },
  ogg: { Icon: FileAudio, tone: 'amber', label: 'Audio track' },
  m4a: { Icon: FileAudio, tone: 'amber', label: 'Audio track' },
  mp4: { Icon: FileVideo, tone: 'rose', label: 'Video clip' },
  mov: { Icon: FileVideo, tone: 'rose', label: 'Video clip' },
  webm: { Icon: FileVideo, tone: 'rose', label: 'Video clip' },
  mkv: { Icon: FileVideo, tone: 'rose', label: 'Video clip' },
  avi: { Icon: FileVideo, tone: 'rose', label: 'Video clip' },
  zip: { Icon: FileArchive, tone: 'indigo', label: 'Archive' },
  rar: { Icon: FileArchive, tone: 'indigo', label: 'Archive' },
  '7z': { Icon: FileArchive, tone: 'indigo', label: 'Archive' },
  tar: { Icon: FileArchive, tone: 'indigo', label: 'Archive' },
  gz: { Icon: FileArchive, tone: 'indigo', label: 'Archive' },
  js: { Icon: FileCode, tone: 'amber', label: 'JavaScript source' },
  jsx: { Icon: FileCode, tone: 'amber', label: 'React component' },
  mjs: { Icon: FileCode, tone: 'amber', label: 'JavaScript module' },
  ts: { Icon: FileCode, tone: 'sky', label: 'TypeScript source' },
  tsx: { Icon: FileCode, tone: 'sky', label: 'React component' },
  json: { Icon: FileCode, tone: 'amber', label: 'JSON data' },
  html: { Icon: FileCode, tone: 'rose', label: 'HTML document' },
  css: { Icon: FileCode, tone: 'sky', label: 'Stylesheet' },
  py: { Icon: FileCode, tone: 'mint', label: 'Python source' },
  java: { Icon: FileCode, tone: 'rose', label: 'Java source' },
  c: { Icon: FileCode, tone: 'sky', label: 'C source' },
  h: { Icon: FileCode, tone: 'sky', label: 'C header' },
  cpp: { Icon: FileCode, tone: 'sky', label: 'C++ source' },
  cs: { Icon: FileCode, tone: 'violet', label: 'C# source' },
  rs: { Icon: FileCode, tone: 'amber', label: 'Rust source' },
  go: { Icon: FileCode, tone: 'sky', label: 'Go source' },
  rb: { Icon: FileCode, tone: 'rose', label: 'Ruby source' },
  php: { Icon: FileCode, tone: 'violet', label: 'PHP source' },
  sql: { Icon: FileCode, tone: 'mint', label: 'SQL script' },
  sh: { Icon: FileCode, tone: 'mint', label: 'Shell script' },
  yml: { Icon: FileCode, tone: 'violet', label: 'YAML config' },
  yaml: { Icon: FileCode, tone: 'violet', label: 'YAML config' },
  env: { Icon: FileCode, tone: 'amber', label: 'Environment file' },
  xml: { Icon: FileCode, tone: 'violet', label: 'XML document' },
}

/** `report.final.pdf` -> `pdf` (lowercase, no dot). */
export function getFileExtension(fileName = '') {
  const clean = String(fileName).split(/[?#]/)[0]
  const base = clean.split(/[\\/]/).pop() || ''
  const dot = base.lastIndexOf('.')
  if (dot <= 0 || dot === base.length - 1) return ''
  return base.slice(dot + 1).toLowerCase()
}

/** Strip directories from a stored path (POSIX or Windows separators). */
export function basename(path = '') {
  if (!path) return ''
  return String(path).split(/[\\/]/).filter(Boolean).pop() || ''
}

const MIME_TONES = [
  ['image/', 'violet'],
  ['video/', 'rose'],
  ['audio/', 'amber'],
  ['application/pdf', 'rose'],
  ['application/zip', 'indigo'],
  ['application/x-', 'indigo'],
  ['text/csv', 'mint'],
  ['spreadsheet', 'mint'],
  ['presentation', 'amber'],
  ['text/', 'slate'],
]

/** Pick an icon, accent colour and human label for a stored file. */
export function getFileDescriptor(fileName = '', contentType = '') {
  const extension = getFileExtension(fileName)
  const mapped = EXTENSION_MAP[extension]

  if (mapped) {
    return {
      extension,
      Icon: mapped.Icon,
      tone: mapped.tone,
      tones: TONES[mapped.tone] ?? TONES.slate,
      label: mapped.label,
    }
  }

  const mime = String(contentType || '').toLowerCase()
  const tone = MIME_TONES.find(([prefix]) => mime.startsWith(prefix))?.[1] || 'slate'
  const isImage = mime.startsWith('image/')

  return {
    extension,
    Icon: isImage ? FileImage : FileIcon,
    tone,
    tones: TONES[tone] ?? TONES.slate,
    label: extension ? `${extension.toUpperCase()} file` : 'File',
  }
}

/** Read `filename="report.pdf"` (or RFC 5987 `filename*=`) from a header. */
export function parseContentDisposition(headerValue, fallback = 'download') {
  const header = String(headerValue || '')
  if (!header) return fallback

  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim().replace(/^"|"$/g, ''))
    } catch {
      /* fall through to the plain filename form */
    }
  }

  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain?.[1] ? plain[1].trim() : fallback
}

/** Push a Blob to the browser's download manager. */
export function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName || 'download'
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Give the browser a beat to start the transfer before revoking the URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}
