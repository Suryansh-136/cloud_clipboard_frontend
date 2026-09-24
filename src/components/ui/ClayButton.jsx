import { LoaderCircle } from 'lucide-react'

const VARIANTS = {
  indigo: 'clay-btn-indigo',
  mint: 'clay-btn-mint',
  violet: 'clay-btn-violet',
  rose: 'clay-btn-rose',
  ghost: 'clay-btn-ghost',
}

const SIZES = {
  sm: 'px-3.5 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm sm:text-base',
  icon: 'h-11 w-11 p-0',
  'icon-sm': 'h-9 w-9 p-0',
}

/**
 * Tactile clay button: raised gradient face, inner highlight, press feedback
 * (`active:scale-95` lives in the `.clay-btn` class) and a built-in spinner.
 */
export function ClayButton({
  as: Component = 'button',
  variant = 'indigo',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  className = '',
  children,
  type = 'button',
  disabled = false,
  ...rest
}) {
  const isButton = Component === 'button'

  return (
    <Component
      type={isButton ? type : undefined}
      disabled={isButton ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      className={`clay-btn ${VARIANTS[variant] ?? VARIANTS.indigo} ${SIZES[size] ?? SIZES.md} ${className}`}
      {...rest}
    >
      {loading ? (
        <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : null}

      {children ? <span className="truncate">{children}</span> : null}

      {!loading && Icon && iconPosition === 'right' ? (
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : null}
    </Component>
  )
}

export default ClayButton
