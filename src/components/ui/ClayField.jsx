import { CircleAlert } from 'lucide-react'

function FieldShell({ id, label, hint, error, required, children }) {
  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={id}
          className="mb-2 flex items-center gap-2 pl-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-clay-300"
        >
          {label}
          {required ? <span className="text-rose-300">*</span> : null}
        </label>
      ) : null}

      {children}

      {error ? (
        <p role="alert" className="mt-2 flex items-center gap-1.5 pl-1 text-xs font-semibold text-rose-300">
          <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-2 pl-1 text-xs text-clay-400">{hint}</p>
      ) : null}
    </div>
  )
}

/** Inset clay text input with optional leading icon. */
export function ClayInput({ id, label, icon: Icon, error, hint, required, className = '', ...props }) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        {Icon ? (
          <Icon
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-clay-400"
            aria-hidden="true"
          />
        ) : null}

        <input
          id={id}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          className={`clay-field py-3 pr-4 text-sm ${Icon ? 'pl-11' : 'pl-4'} ${
            error ? 'clay-field-invalid' : ''
          } ${className}`}
          {...props}
        />
      </div>
    </FieldShell>
  )
}

/** Inset clay textarea, optionally showing a live character counter. */
export function ClayTextarea({
  id,
  label,
  error,
  hint,
  required,
  maxLength,
  value,
  footer,
  className = '',
  rows = 6,
  ...props
}) {
  const used = typeof value === 'string' ? value.length : 0

  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
    >
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        className={`clay-field resize-y px-4 py-3 text-sm leading-relaxed ${
          error ? 'clay-field-invalid' : ''
        } ${className}`}
        {...props}
      />

      <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[0.7rem] text-clay-400">
        <span className="truncate">{footer}</span>
        {maxLength ? (
          <span className={used > maxLength * 0.9 ? 'font-semibold text-amber-200' : ''}>
            {used}/{maxLength}
          </span>
        ) : null}
      </div>
    </FieldShell>
  )
}
