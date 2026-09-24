/** Raised clay container. `interactive` adds the lift-on-hover treatment. */
export function ClayCard({ as: Component = 'div', interactive = false, className = '', children, ...rest }) {
  return (
    <Component
      className={`clay-card ${interactive ? 'clay-card-hover' : ''} rounded-clay ${className}`}
      {...rest}
    >
      {children}
    </Component>
  )
}

export default ClayCard
