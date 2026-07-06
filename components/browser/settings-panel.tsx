'use client'

import { useEffect, useState } from 'react'
import { Moon, Search, Settings, ShieldCheck, Sun, UserX, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useBrowser } from '@/lib/browser/store'
import { SEARCH_ENGINES, type SearchEngine } from '@/lib/browser/types'
import { cn } from '@/lib/utils'

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-[11px] leading-relaxed text-muted-foreground">{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-input',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-4 rounded-full bg-background shadow transition-transform',
            checked ? 'translate-x-4.5 left-0' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}

export function SettingsPanel() {
  const { settings, updateSettings, setActivePanel } = useBrowser()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Settings className="size-4 text-muted-foreground" aria-hidden="true" />
          Settings
        </h2>
        <button
          type="button"
          onClick={() => setActivePanel(null)}
          aria-label="Close settings"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {/* Appearance */}
        <section aria-labelledby="appearance-heading">
          <h3 id="appearance-heading" className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Appearance
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium capitalize transition-colors',
                  mounted && theme === t
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-ring/50',
                )}
              >
                {t === 'light' ? (
                  <Sun className="size-4" aria-hidden="true" />
                ) : t === 'dark' ? (
                  <Moon className="size-4" aria-hidden="true" />
                ) : (
                  <Settings className="size-4" aria-hidden="true" />
                )}
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Search engine */}
        <section aria-labelledby="search-heading" className="mt-6">
          <h3 id="search-heading" className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Search className="size-3" aria-hidden="true" />
            Search engine
          </h3>
          <div className="flex flex-col gap-2">
            {(Object.keys(SEARCH_ENGINES) as SearchEngine[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => updateSettings({ searchEngine: key })}
                className={cn(
                  'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
                  settings.searchEngine === key
                    ? 'border-primary bg-accent'
                    : 'border-border bg-card hover:border-ring/50',
                )}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-medium">{SEARCH_ENGINES[key].name}</span>
                  <span className="text-[11px] text-muted-foreground">{SEARCH_ENGINES[key].home}</span>
                </div>
                <span
                  className={cn(
                    'flex size-4 items-center justify-center rounded-full border',
                    settings.searchEngine === key ? 'border-primary' : 'border-input',
                  )}
                >
                  {settings.searchEngine === key && <span className="size-2 rounded-full bg-primary" />}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Privacy & shields */}
        <section aria-labelledby="privacy-heading" className="mt-6">
          <h3 id="privacy-heading" className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="size-3" aria-hidden="true" />
            Privacy &amp; shields
          </h3>
          <div className="divide-y divide-border">
            <Toggle
              checked={settings.adBlockerEnabled}
              onChange={(v) => updateSettings({ adBlockerEnabled: v })}
              label="Browser shields"
              description="Block known ad requests, hide ad containers and activate supported Skip/Close ad controls"
            />
            <Toggle
              checked={settings.fastForwardYoutubeAds}
              onChange={(v) => updateSettings({ fastForwardYoutubeAds: v })}
              label="Fast-forward YouTube video ads"
              description="Accelerate only when YouTube reports an active ad and visible ad UI; normal videos are restored immediately"
            />
            <Toggle
              checked={settings.blockTrackers}
              onChange={(v) => updateSettings({ blockTrackers: v })}
              label="Block trackers"
              description="Also block known analytics and tracking requests; disable this if a site misbehaves"
            />
            <Toggle
              checked={settings.httpsOnly}
              onChange={(v) => updateSettings({ httpsOnly: v })}
              label="HTTPS only"
              description="Automatically upgrade connections to HTTPS"
            />
            <Toggle
              checked={settings.saveHistory}
              onChange={(v) => updateSettings({ saveHistory: v })}
              label="Save browsing history"
              description="Keep app navigation history on this device (not in private tabs)"
            />
          </div>
        </section>

        {/* No accounts */}
        <section className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-card p-3">
          <UserX className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-[11px] leading-relaxed text-muted-foreground text-pretty">
            <span className="font-medium text-foreground">No browser account.</span> Web 3 Browser has no sign-up, login or
            cloud sync. App settings and app history stay in local storage on this device.
          </p>
        </section>
      </div>
    </div>
  )
}
