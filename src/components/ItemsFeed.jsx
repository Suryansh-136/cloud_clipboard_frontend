import { useMemo, useState } from 'react'
import { CircleAlert, Inbox, RefreshCw, Search, Sparkles } from 'lucide-react'

import { ItemCard } from './ItemCard'
import { ClayBadge } from './ui/ClayBadge'
import { ClayButton } from './ui/ClayButton'
import { ClayIconBadge } from './ui/ClayIconBadge'
import { pluralize } from '../utils/format'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'text', label: 'Text' },
  { key: 'files', label: 'Files' },
]

function matchesFilter(item, filter) {
  if (filter === 'text') return item.isText
  if (filter === 'files') return !item.isText
  return true
}

/** The claymorphic feed: search, type filter, skeletons and every empty state. */
export function ItemsFeed({ items, counts, status, error, deletingId, onDelete, onReload }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return items.filter((item) => {
      if (!matchesFilter(item, filter)) return false
      if (!needle) return true

      return [item.title, item.fileName, item.content]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [items, filter, query])

  const hasItems = items.length > 0
  const filtering = Boolean(query.trim()) || filter !== 'all'

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-clay-50">
            <Sparkles className="h-5 w-5 text-indigo-300" aria-hidden="true" />
            Your clipboard
          </h2>
          <p className="mt-1 text-xs text-clay-400">
            {hasItems
              ? `${pluralize(counts.total, 'item')} · ${counts.text} text · ${counts.files} files`
              : 'Everything you save shows up here.'}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="relative min-w-[13rem] flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-clay-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search snippets and files…"
              aria-label="Search items"
              className="clay-field py-2.5 pl-11 pr-4 text-sm"
            />
          </div>

          <ClayButton
            variant="ghost"
            size="icon-sm"
            icon={RefreshCw}
            onClick={() => onReload?.({ silent: true })}
            loading={status === 'loading'}
            title="Reload items"
            aria-label="Reload items"
          />
        </div>
      </div>

      <div className="clay-tab-track inline-flex rounded-full p-1.5">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            className={`clay-tab px-4 py-2 text-xs ${filter === key ? 'clay-tab-active' : ''}`}
          >
            {label}
            <span className="ml-1 font-mono text-[0.68rem] text-clay-400">
              {key === 'all' ? counts.total : key === 'text' ? counts.text : counts.files}
            </span>
          </button>
        ))}
      </div>

      {status === 'loading' && !hasItems ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="clay-skeleton h-56" />
          ))}
        </div>
      ) : status === 'error' ? (
        <div className="clay-panel rounded-clay animate-pop flex flex-col items-center gap-4 px-6 py-12 text-center">
          <ClayIconBadge icon={CircleAlert} gradient="rose" size="lg" />
          <div>
            <h3 className="text-base font-extrabold text-clay-50">Could not reach your clipboard</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-clay-300">{error}</p>
            <p className="mx-auto mt-2 max-w-sm text-[0.7rem] text-clay-500">
              The free backend sleeps when idle — the first request can take up to a minute.
            </p>
          </div>
          <ClayButton
            variant="indigo"
            icon={RefreshCw}
            loading={status === 'loading'}
            onClick={() => onReload?.()}
          >
            Try again
          </ClayButton>
        </div>
      ) : !hasItems ? (
        <div className="clay-panel rounded-clay animate-pop flex flex-col items-center gap-4 px-6 py-14 text-center">
          <ClayIconBadge icon={Inbox} gradient="indigo" size="xl" className="animate-float" />
          <div>
            <h3 className="text-base font-extrabold text-clay-50">Your bridge is empty</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-clay-300">
              Save your first snippet or drop a file above — it will appear here instantly and stay
              in sync across your devices.
            </p>
          </div>
          <ClayBadge tone="violet" icon={Sparkles}>
            Text and files supported
          </ClayBadge>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="clay-panel rounded-clay animate-pop flex flex-col items-center gap-3 px-6 py-12 text-center">
          <ClayIconBadge icon={Search} gradient="violet" size="lg" />
          <h3 className="text-base font-extrabold text-clay-50">Nothing matches that filter</h3>
          <p className="max-w-sm text-xs text-clay-300">
            {query.trim() ? `No items contain “${query.trim()}”.` : 'Try a different type filter.'}
          </p>
          {filtering ? (
            <ClayButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('')
                setFilter('all')
              }}
            >
              Clear filters
            </ClayButton>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => (
            // `onDelete` receives the item id — the feed performs the DELETE.
            <ItemCard
              key={item.id}
              item={item}
              deleting={deletingId === item.id}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default ItemsFeed
