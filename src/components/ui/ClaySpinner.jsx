import { LoaderCircle } from 'lucide-react'

/** Centred clay spinner for full-page / section loading states. */
export function ClaySpinner({ size = 'md', label, className = '' }) {
  const dimensions = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} role="status">
      <span className="relative grid place-items-center">
        <span className="clay-icon-badge h-16 w-16 bg-linear-to-br from-clay-750 to-clay-900">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-400/80 animate-pulse-ring" />
        </span>
        <LoaderCircle
          className={`absolute ${dimensions[size] ?? dimensions.md} animate-spin text-indigo-300`}
          aria-hidden="true"
        />
      </span>

      {label ? <p className="text-sm font-semibold text-clay-300">{label}</p> : null}
      <span className="sr-only">{label || 'Loading'}</span>
    </div>
  )
}

export default ClaySpinner
