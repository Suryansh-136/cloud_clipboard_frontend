import { Link } from 'react-router-dom'
import { CloudOff, Home } from 'lucide-react'

import { ClayButton } from '../components/ui/ClayButton'
import { ClayIconBadge } from '../components/ui/ClayIconBadge'

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-16">
      <div className="clay-panel rounded-clay-lg animate-pop flex max-w-md flex-col items-center gap-5 px-8 py-14 text-center">
        <ClayIconBadge icon={CloudOff} gradient="rose" size="xl" className="animate-float" />
        <div>
          <p className="font-mono text-4xl font-extrabold clay-text-gradient">404</p>
          <h1 className="mt-2 text-lg font-extrabold text-clay-50">Lost in the cloud</h1>
          <p className="mt-1 text-xs text-clay-300">
            That page drifted away. Your snippets are safe — head back to the dashboard.
          </p>
        </div>

        <ClayButton as={Link} to="/dashboard" variant="indigo" icon={Home}>
          Back to dashboard
        </ClayButton>
      </div>
    </main>
  )
}

export default NotFoundPage
