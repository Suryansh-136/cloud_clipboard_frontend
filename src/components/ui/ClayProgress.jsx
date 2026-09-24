/** Inset clay progress meter used by the upload / download flows. */
export function ClayProgress({ value = 0, label, detail, tone = 'default', className = '' }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))

  const fills = {
    default: 'clay-progress-fill',
    mint: 'clay-progress-fill bg-linear-to-r from-mint to-mint-deep',
    rose: 'clay-progress-fill bg-linear-to-r from-rose-clay to-rose-deep',
  }

  return (
    <div className={className}>
      {label || detail ? (
        <div className="mb-2 flex items-baseline justify-between gap-3">
          {label ? (
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-clay-300">
              {label}
            </span>
          ) : (
            <span />
          )}
          <span className="font-mono text-xs font-semibold text-indigo-200">{clamped}%</span>
        </div>
      ) : null}

      <div
        className="clay-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        aria-label={label || 'Progress'}
      >
        <div className={fills[tone] ?? fills.default} style={{ width: `${clamped}%` }} />
      </div>

      {detail ? <p className="mt-2 pl-1 text-xs text-clay-400">{detail}</p> : null}
    </div>
  )
}

export default ClayProgress
