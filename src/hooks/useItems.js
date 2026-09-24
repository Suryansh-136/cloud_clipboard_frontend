import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { getApiErrorMessage } from '../api/client'
import { deleteItem as deleteItemRequest, fetchItems } from '../api/items'
import { normalizeItem, normalizeItems } from '../utils/items'

/**
 * Owns the clipboard feed: loading, refreshing, optimistic-ish prepend and
 * deletion. Keeps the dashboard component free of request bookkeeping.
 */
export function useItems() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setStatus('loading')
    setError(null)

    try {
      const rows = await fetchItems()
      setItems(normalizeItems(rows))
      setStatus('ready')
      setLastSyncedAt(new Date())
    } catch (err) {
      const message = await getApiErrorMessage(err, 'Could not load your items.')
      setError(message)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addItem = useCallback(
    (row) => {
      if (!row?.id) {
        // Without an id we cannot de-duplicate, so trust the server instead.
        load({ silent: true })
        return
      }

      setItems((previous) => [
        normalizeItem(row),
        ...previous.filter((item) => item.id !== row.id),
      ])
      setLastSyncedAt(new Date())
    },
    [load],
  )

  const removeItem = useCallback(async (itemId) => {
    setDeletingId(itemId)
    try {
      await deleteItemRequest(itemId)
      setItems((previous) => previous.filter((item) => item.id !== itemId))
      toast.success('Item deleted')
      return true
    } catch (err) {
      toast.error(await getApiErrorMessage(err, 'Could not delete that item.'))
      return false
    } finally {
      setDeletingId(null)
    }
  }, [])

  const counts = useMemo(
    () => ({
      total: items.length,
      text: items.filter((item) => item.isText).length,
      files: items.filter((item) => !item.isText).length,
    }),
    [items],
  )

  return {
    items,
    counts,
    status,
    error,
    deletingId,
    lastSyncedAt,
    reload: load,
    refresh: useCallback(() => load({ silent: true }), [load]),
    addItem,
    removeItem,
  }
}

export default useItems
