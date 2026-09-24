import { CloudUpload, FileText, Layers, LifeBuoy, Sparkles, Type } from 'lucide-react'

import { ActionBox } from '../components/ActionBox'
import { ItemsFeed } from '../components/ItemsFeed'
import { Navbar } from '../components/Navbar'
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

function TipsPanel() {
  return (
    <section className="clay-panel rounded-clay animate-pop p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <ClayIconBadge icon={LifeBuoy} gradient="slate" size="md" />
        <h2 className="text-sm font-extrabold text-clay-50">Bridge tips</h2>
      </div>

      <ul className="mt-4 space-y-3 text-xs leading-relaxed text-clay-300">
        <li className="flex gap-2">
          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-300" aria-hidden="true" />
          <span>
            Snippets are stored as raw text — the feed labels them from their first line because the
            API keeps no title column.
          </span>
        </li>
        <li className="flex gap-2">
          <CloudUpload className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden="true" />
          <span>
            Files are pushed to the storage the backend is connected to; we keep its share link so
            you can download them from anywhere.
          </span>
        </li>
        <li className="flex gap-2">
          <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden="true" />
          <span>Deleting asks for confirmation first — nothing disappears with a single stray click.</span>
        </li>
      </ul>
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
            <TipsPanel />
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
