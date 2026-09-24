/**
 * Copy text to the clipboard with a legacy fallback, because `navigator.clipboard`
 * is unavailable on insecure origins (e.g. http:// LAN previews on a phone).
 */
export async function copyTextToClipboard(text) {
  const value = String(text ?? '')

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      /* fall through to the execCommand path */
    }
  }

  try {
    const area = document.createElement('textarea')
    area.value = value
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '-1000px'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}

export default copyTextToClipboard
