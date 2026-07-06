'use client'

import { Globe, ShieldCheck, VenetianMask } from 'lucide-react'
import { useBrowser } from '@/lib/browser/store'
import { BLOCKLIST_SIZE } from '@/lib/browser/adblock'

const SHORTCUTS = [
  { label: 'Wikipedia', url: 'https://www.wikipedia.org' },
  { label: 'Brave Search', url: 'https://search.brave.com' },
  { label: 'MDN Docs', url: 'https://developer.mozilla.org' },
  { label: 'Hacker News', url: 'https://news.ycombinator.com' },
  { label: 'OpenStreetMap', url: 'https://www.openstreetmap.org' },
  { label: 'Ethereum.org', url: 'https://ethereum.org' },
]

export function StartPage() {
  const { navigate, activeTab, settings, totalBlocked } = useBrowser()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 overflow-y-auto bg-background px-6 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        {activeTab.incognito ? (
          <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <VenetianMask className="size-7" aria-hidden="true" />
          </div>
        ) : (
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Globe className="size-7" aria-hidden="true" />
          </div>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {activeTab.incognito ? 'Private tab' : 'Web 3 Browser'}
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
          {activeTab.incognito
            ? 'Private tabs are excluded from app history. In the Tauri desktop app they open in an incognito native WebView; the web-preview launcher is not a private browser.'
            : 'The Tauri desktop app opens pages in native WebViews. The separate web-preview launcher only previews the interface and cannot embed many major websites.'}
        </p>
      </div>

      <div className="grid w-full max-w-xl grid-cols-2 gap-2 sm:grid-cols-3">
        {SHORTCUTS.map((shortcut) => (
          <button
            key={shortcut.url}
            type="button"
            onClick={() => navigate(shortcut.url)}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm transition-colors hover:border-ring/50 hover:bg-secondary"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
              <Globe className="size-3.5" aria-hidden="true" />
            </span>
            <span className="truncate font-medium">{shortcut.label}</span>
          </button>
        ))}
      </div>

      {settings.adBlockerEnabled && !activeTab.incognito && (
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
          <span>
            <span className="font-semibold text-foreground tabular-nums">{totalBlocked}</span>
            {` blocked direct navigations this session · ${BLOCKLIST_SIZE} hostname rules plus page-level ad hiding active`}
          </span>
        </div>
      )}
    </div>
  )
}
