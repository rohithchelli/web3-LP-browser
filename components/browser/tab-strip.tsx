'use client'

import { Globe, Plus, VenetianMask, X } from 'lucide-react'
import { useBrowser } from '@/lib/browser/store'
import { cn } from '@/lib/utils'

export function TabStrip() {
  const { tabs, activeTabId, setActiveTabId, closeTab, addTab } = useBrowser()

  return (
    <div className="flex items-end gap-1 bg-sidebar px-2 pt-2" role="tablist" aria-label="Browser tabs">
      <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto [scrollbar-width:none]">
        {tabs.map((tab) => {
          const active = tab.id === activeTabId
          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={active}
              tabIndex={0}
              onClick={() => setActiveTabId(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setActiveTabId(tab.id)
              }}
              className={cn(
                'group flex h-9 w-40 min-w-24 shrink-0 cursor-pointer items-center gap-2 rounded-t-lg px-3 text-sm transition-colors sm:w-48',
                active
                  ? 'bg-background text-foreground'
                  : 'bg-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                tab.incognito && active && 'bg-accent text-accent-foreground',
              )}
            >
              {tab.incognito ? (
                <VenetianMask className="size-3.5 shrink-0" aria-label="Private tab" />
              ) : (
                <Globe className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1 truncate text-xs font-medium">{tab.title}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                aria-label={`Close ${tab.title}`}
                className="rounded-sm p-0.5 opacity-0 transition-opacity hover:bg-muted focus-visible:opacity-100 group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => addTab(false)}
        aria-label="New tab"
        className="mb-1 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}
