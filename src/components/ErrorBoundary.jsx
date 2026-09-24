import { Component } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'

import { ClayButton } from './ui/ClayButton'
import { ClayIconBadge } from './ui/ClayIconBadge'

/** Last line of defence: keeps a render error from blanking the whole page. */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[Cloud ClipBoard] Unhandled UI error', error, info)
  }

  handleReload = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  render() {
    const { error } = this.state

    if (!error) {
      return this.props.children
    }

    return (
      <div className="grid min-h-screen place-items-center px-4 py-16">
        <div className="clay-panel rounded-clay-lg animate-pop flex max-w-lg flex-col items-center gap-5 px-8 py-12 text-center">
          <ClayIconBadge icon={TriangleAlert} gradient="amber" size="xl" />

          <div>
            <h1 className="text-lg font-extrabold text-clay-50">Something cracked the clay</h1>
            <p className="mt-1 text-xs text-clay-300">
              An unexpected interface error occurred. Reloading usually clears it.
            </p>
            <p className="clay-inset-sm mt-3 max-h-32 overflow-auto rounded-2xl px-4 py-3 text-left font-mono text-[0.68rem] text-rose-200">
              {String(error?.message || error)}
            </p>
          </div>

          <ClayButton variant="indigo" icon={RefreshCw} onClick={this.handleReload}>
            Reload the app
          </ClayButton>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
