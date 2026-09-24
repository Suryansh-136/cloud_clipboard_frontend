const SIZES = {
  sm: { box: 'h-9 w-9', icon: 'h-4 w-4' },
  md: { box: 'h-11 w-11', icon: 'h-5 w-5' },
  lg: { box: 'h-14 w-14', icon: 'h-6 w-6' },
  xl: { box: 'h-16 w-16', icon: 'h-7 w-7' },
}

const GRADIENTS = {
  indigo: 'from-indigo-clay to-indigo-deep',
  mint: 'from-mint to-mint-deep',
  violet: 'from-violet-clay to-violet-deep',
  rose: 'from-rose-clay to-rose-deep',
  amber: 'from-amber-clay to-orange-600',
  sky: 'from-sky-clay to-blue-600',
  slate: 'from-clay-600 to-clay-800',
}

/** Soft circular clay badge that hosts a lucide icon. */
export function ClayIconBadge({
  icon: Icon,
  gradient = 'indigo',
  size = 'md',
  className = '',
  iconClassName = '',
  ...rest
}) {
  const dimension = SIZES[size] ?? SIZES.md

  return (
    <span
      className={`clay-icon-badge bg-linear-to-br ${GRADIENTS[gradient] ?? GRADIENTS.indigo} ${
        dimension.box
      } ${className}`}
      {...rest}
    >
      {Icon ? (
        <Icon className={`${dimension.icon} ${iconClassName}`} aria-hidden="true" />
      ) : null}
    </span>
  )
}

export default ClayIconBadge
