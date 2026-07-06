'use client'

import { useState } from 'react'
import { Clock, Globe, Search, Trash2, X } from 'lucide-react'
import { useBrowser } from '@/lib/browser/store'

function formatTime(ts: number) {
  const d = new Date(ts)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return isToday ? time : `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`
}

export function HistoryPanel() {
  const { history, deleteHistoryEntry, clearHistory, navigate, setActivePanel } = useBrowser()
  const [filter, setFilter] = useState('')

  const filtered = history.filter(
    (h) =>
      h.title.toLowerCase().includes(filter.toLowerCase()) || h.url.toLowerCase().includes(filter.toLowerCase()),
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
          History
        </h2>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="size-3" aria-hidden="true" />
              Clear all
            </button>
          )}
          <button
            type="button"
            onClick={() => setActivePanel(null)}
            aria-label="Close history"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="border-b border-border p-3">
        <div className="flex h-8 items-center gap-2 rounded-md border border-input bg-secondary/50 px-2.5 focus-within:border-ring">
          <Search className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search history"
            aria-label="Search history"
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-xs leading-relaxed text-muted-foreground">
            {history.length === 0
              ? 'No browsing history yet. Private tabs are excluded from app history.'
              : 'No matches found.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {filtered.map((h) => (
              <li key={h.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary">
                <Globe className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => navigate(h.url)}
                  className="flex min-w-0 flex-1 flex-col items-start text-left"
                >
                  <span className="w-full truncate text-xs font-medium">{h.title}</span>
                  <span className="w-full truncate text-[11px] text-muted-foreground">{h.url}</span>
                </button>
                <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">{formatTime(h.visitedAt)}</span>
                <button
                  type="button"
                  onClick={() => deleteHistoryEntry(h.id)}
                  aria-label={`Delete ${h.title} from history`}
                  className="shrink-0 rounded-sm p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
