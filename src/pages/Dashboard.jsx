import { CloudUpload, Layers, Sparkles, Type } from 'lucide-react'

import { ActionBox } from '../components/ActionBox'
import { ItemsFeed } from '../components/ItemsFeed'
import { Navbar } from '../components/Navbar'
import { ShareLinkWidget } from '../components/ShareLinkWidget'
import { ClayIconBadge } from '../components/ui/ClayIconBadge'
import { useAuth } from '../context/AuthContext'
import { useItems } from '../hooks/useItems'
import { formatDateTime } from '../utils/format'

const STAT_TILES = [
  { key: 'total', label: 'Saved items', icon: Layers, gradient: 'indigo' },
  { key: 'text', label: 'Text snippets', icon: Type, gradient: 'violet' },
  { key: 'files', label: 'Files', icon: CloudUpload, gradient: 'mint' },
]

function StatsPanel({ counts, user }) {
  return (
    <section className="clay-panel rounded-clay animate-pop p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <ClayIconBadge icon={Sparkles} gradient="violet" size="md" />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-extrabold text-clay-50">
            Hello{user?.email ? `, ${user.email.split('@')[0]}` : ''} 👋
          </h2>
          <p className="truncate text-xs text-clay-400">{user?.email || 'Signed in'}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {STAT_TILES.map(({ key, label, icon: Icon, gradient }) => (
          <div key={key} className="clay-inset-sm rounded-2xl px-3 py-4 text-center">
            <ClayIconBadge icon={Icon} gradient={gradient} size="sm" className="mx-auto" />
            <p className="mt-2 font-mono text-lg font-extrabold text-clay-50">{counts[key]}</p>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-clay-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      {user?.created_at ? (
        <p className="mt-4 text-center text-[0.7rem] text-clay-500">
          Bridge opened {formatDateTime(user.created_at)}
        </p>
      ) : null}
    </section>
  )
}

/** Protected home screen: navbar, clay action box, stats and the items feed. */
export function Dashboard() {
  const { user } = useAuth()
  const {
    items,
    counts,
    status,
    error,
    deletingId,
    lastSyncedAt,
    reload,
    refresh,
    addItem,
    removeItem,
  } = useItems()

  return (
    <div className="min-h-screen pb-16">
      <Navbar
        counts={counts}
        lastSyncedAt={lastSyncedAt}
        onRefresh={refresh}
        refreshing={status === 'loading' && items.length > 0}
      />

      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <ActionBox onCreated={addItem} />

          <aside className="space-y-6">
            <StatsPanel counts={counts} user={user} />
            <ShareLinkWidget />
          </aside>
        </div>

        <ItemsFeed
          items={items}
          counts={counts}
          status={status}
          error={error}
          deletingId={deletingId}
          onDelete={removeItem}
          onReload={reload}
        />
      </main>
    </div>
  )
}

export default Dashboard
