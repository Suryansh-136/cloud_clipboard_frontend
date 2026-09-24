const TONES = {
  indigo: 'border-indigo-400/30 bg-indigo-500/15 text-indigo-200',
  mint: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200',
  violet: 'border-violet-400/30 bg-violet-500/15 text-violet-200',
  rose: 'border-rose-400/30 bg-rose-500/15 text-rose-200',
  amber: 'border-amber-400/30 bg-amber-500/15 text-amber-200',
  sky: 'border-sky-400/30 bg-sky-500/15 text-sky-200',
  slate: 'border-clay-500/40 bg-clay-700/40 text-clay-200',
}

/** Small clay pill used for the logged-in email, counters and item types. */
export function ClayBadge({ tone = 'slate', icon: Icon, className = '', title, children }) {
  return (
    <span
      title={title}
      className={`clay-chip px-3 py-1.5 text-xs font-semibold tracking-wide ${
        TONES[tone] ?? TONES.slate
      } ${className}`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
      <span className="truncate">{children}</span>
    </span>
  )
}

export default ClayBadge
