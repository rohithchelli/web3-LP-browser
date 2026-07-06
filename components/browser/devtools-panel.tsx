'use client'

import { useState } from 'react'
import { Ban, SquareCode, Trash2, X } from 'lucide-react'
import { useBrowser } from '@/lib/browser/store'
import { cn } from '@/lib/utils'

type DevTab = 'console' | 'network' | 'page'

export function DevToolsPanel() {
  const { consoleEntries, networkEntries, clearConsole, setActivePanel, activeTab, settings, totalBlocked } =
    useBrowser()
  const [tab, setTab] = useState<DevTab>('console')

  const levelColor: Record<string, string> = {
    log: 'text-foreground',
    info: 'text-primary',
    warn: 'text-yellow-500',
    error: 'text-destructive',
  }

  return (
    <div className="flex h-full flex-col font-mono">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 font-sans">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <SquareCode className="size-4 text-muted-foreground" aria-hidden="true" />
          DevTools
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={clearConsole}
            aria-label="Clear logs"
            title="Clear logs"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Trash2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActivePanel(null)}
            aria-label="Close dev tools"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-border font-sans" role="tablist" aria-label="DevTools sections">
        {(['console', 'network', 'page'] as DevTab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-xs font-medium capitalize transition-colors',
              tab === t
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'console' && (
          <ul className="flex flex-col divide-y divide-border/50">
            {consoleEntries.length === 0 && (
              <li className="px-4 py-6 text-center text-[11px] text-muted-foreground">Console is empty.</li>
            )}
            {consoleEntries.map((e) => (
              <li key={e.id} className="flex gap-2 px-3 py-1.5 text-[11px] leading-relaxed">
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
                <span className={cn('break-all', levelColor[e.level])}>{e.message}</span>
              </li>
            ))}
          </ul>
        )}

        {tab === 'network' && (
          <ul className="flex flex-col divide-y divide-border/50">
            {networkEntries.length === 0 && (
              <li className="px-4 py-6 text-center text-[11px] text-muted-foreground">No requests recorded.</li>
            )}
            {networkEntries.map((e) => (
              <li key={e.id} className="flex items-center gap-2 px-3 py-1.5 text-[11px]">
                <span
                  className={cn(
                    'flex w-14 shrink-0 items-center gap-1 font-medium uppercase',
                    e.status === 'blocked'
                      ? 'text-destructive'
                      : e.status === 'done'
                        ? 'text-primary'
                        : 'text-muted-foreground',
                  )}
                >
                  {e.status === 'blocked' && <Ban className="size-3" aria-hidden="true" />}
                  {e.status}
                </span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{e.url}</span>
                <span className="shrink-0 text-muted-foreground">{e.method}</span>
              </li>
            ))}
          </ul>
        )}

        {tab === 'page' && (
          <dl className="flex flex-col gap-3 p-4 text-[11px]">
            <InfoRow label="URL" value={activeTab.url ?? 'about:newtab'} />
            <InfoRow label="Title" value={activeTab.title} />
            <InfoRow
              label="Mode"
              value={
                activeTab.incognito
                  ? 'Private: no app history; native desktop WebView requests incognito storage'
                  : 'Standard'
              }
            />
            <InfoRow label="Blocked direct navigations (tab)" value={String(activeTab.blockedAds)} />
            <InfoRow label="Blocked direct navigations (session)" value={String(totalBlocked)} />
            <InfoRow label="Native browser shields" value={settings.adBlockerEnabled ? 'Enabled' : 'Disabled'} />
            <InfoRow label="Tracker blocking" value={settings.blockTrackers ? 'Enabled' : 'Disabled'} />
            <InfoRow label="HTTPS only" value={settings.httpsOnly ? 'Enabled' : 'Disabled'} />
            <InfoRow
              label="Rendering mode"
              value="Native Tauri child WebView in desktop mode; iframe only in UI-preview mode"
            />
          </dl>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-sans font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="break-all text-foreground">{value}</dd>
    </div>
  )
}
