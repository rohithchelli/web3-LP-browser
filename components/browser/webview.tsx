'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink, Minimize, MonitorUp } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { Webview } from '@tauri-apps/api/webview'
import { useBrowser } from '@/lib/browser/store'
import { isNativeDesktop, nativeLabel, tabIdFromNativeLabel } from '@/lib/browser/native'
import type { NativePageLoadEvent, Tab } from '@/lib/browser/types'
import { StartPage } from './start-page'
import { cn } from '@/lib/utils'

interface NativeViewRecord {
  ready: Promise<Webview>
}

function viewBounds(element: HTMLElement, topInset = 0) {
  const rect = element.getBoundingClientRect()
  return {
    x: Math.max(0, rect.left),
    y: Math.max(0, rect.top + topInset),
    width: Math.max(1, rect.width),
    height: Math.max(1, rect.height - topInset),
  }
}

export function WebView() {
  const {
    activeTab,
    activeTabId,
    tabs,
    activePanel,
    immersive,
    setImmersive,
    markTabLoaded,
    syncNativePageLoad,
    logConsole,
    settings,
  } = useBrowser()
  const [showControls, setShowControls] = useState(true)
  const [nativeMode, setNativeMode] = useState(false)
  const [nativeError, setNativeError] = useState<string | null>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const nativeViewsRef = useRef(new Map<string, NativeViewRecord>())
  const actualUrlsRef = useRef(new Map<string, string>())
  const lastReloadRef = useRef(new Map<string, number>())
  const lastBackRef = useRef(new Map<string, number>())
  const lastForwardRef = useRef(new Map<string, number>())
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    setNativeMode(isNativeDesktop())
  }, [])

  const applyNativeShields = useCallback(
    async (label: string) => {
      try {
        await invoke('browser_apply_shields', { label })
      } catch (error) {
        logConsole('warn', `Could not apply browser shields to ${label}: ${String(error)}`)
      }
    },
    [logConsole],
  )

  useEffect(() => {
    if (!nativeMode) return
    let cancelled = false

    void invoke('browser_set_shields', {
      enabled: settings.adBlockerEnabled,
      blockTrackers: settings.blockTrackers,
      fastForwardYoutubeAds: settings.fastForwardYoutubeAds,
    })
      .then(async () => {
        if (cancelled) return
        for (const [tabId, record] of nativeViewsRef.current.entries()) {
          try {
            await record.ready
            if (!cancelled) await applyNativeShields(nativeLabel(tabId))
          } catch {
            // Ignore views that were closed while settings were being applied.
          }
        }
      })
      .catch((error) => {
        logConsole('error', `Could not update browser shield settings: ${String(error)}`)
      })

    return () => {
      cancelled = true
    }
  }, [nativeMode, settings.adBlockerEnabled, settings.blockTrackers, settings.fastForwardYoutubeAds, applyNativeShields, logConsole])

  useEffect(() => {
    if (!immersive) return

    const revealControls = () => {
      setShowControls(true)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setImmersive(false)
      if (event.key === ' ') revealControls()
    }

    revealControls()
    window.addEventListener('mousemove', revealControls)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousemove', revealControls)
      window.removeEventListener('keydown', handleKeyDown)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [immersive, setImmersive])

  useEffect(() => {
    if (!nativeMode) return
    let unlisten: UnlistenFn | undefined
    let cancelled = false

    listen<NativePageLoadEvent>('browser-page-load', (event) => {
      const payload = event.payload
      const tabId = tabIdFromNativeLabel(payload.label)
      if (!tabId) return
      actualUrlsRef.current.set(tabId, payload.url)
      syncNativePageLoad(payload)
      if (payload.status === 'finished') void applyNativeShields(payload.label)
    })
      .then((fn) => {
        if (cancelled) fn()
        else unlisten = fn
      })
      .catch((error) => {
        const message = `Could not subscribe to native page events: ${String(error)}`
        setNativeError(message)
        logConsole('error', message)
      })

    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [nativeMode, syncNativePageLoad, applyNativeShields, logConsole])

  const createNativeView = useCallback(
    (tab: Tab, bounds: ReturnType<typeof viewBounds>): NativeViewRecord => {
      const label = nativeLabel(tab.id)
      const ready = invoke('browser_create_webview', {
        label,
        url: tab.url as string,
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        focus: tab.id === activeTabId,
        incognito: tab.incognito,
      }).then(async () => {
        const webview = await Webview.getByLabel(label)
        if (!webview) throw new Error(`Native webview was created but could not be resolved: ${label}`)
        await applyNativeShields(label)
        return webview
      })

      const record = { ready }
      nativeViewsRef.current.set(tab.id, record)
      actualUrlsRef.current.set(tab.id, tab.url as string)
      lastReloadRef.current.set(tab.id, tab.reloadNonce)
      lastBackRef.current.set(tab.id, tab.backNonce)
      lastForwardRef.current.set(tab.id, tab.forwardNonce)
      return record
    },
    [activeTabId, applyNativeShields],
  )

  const syncNativeViews = useCallback(async () => {
    if (!nativeMode || !hostRef.current) return

    const bounds = viewBounds(hostRef.current, immersive ? 44 : 0)
    const liveIds = new Set(tabs.filter((tab) => tab.url).map((tab) => tab.id))

    for (const [tabId, record] of nativeViewsRef.current.entries()) {
      if (!liveIds.has(tabId)) {
        try {
          const webview = await record.ready
          await webview.close()
        } catch {
          // The view may already have failed or been closed.
        }
        nativeViewsRef.current.delete(tabId)
        actualUrlsRef.current.delete(tabId)
        lastReloadRef.current.delete(tabId)
        lastBackRef.current.delete(tabId)
        lastForwardRef.current.delete(tabId)
      }
    }

    for (const tab of tabs) {
      if (!tab.url) continue
      let record = nativeViewsRef.current.get(tab.id)
      if (!record) record = createNativeView(tab, bounds)

      let webview: Webview
      try {
        webview = await record.ready
      } catch (error) {
        const message = `Native webview failed for ${tab.url}: ${String(error)}`
        nativeViewsRef.current.delete(tab.id)
        setNativeError(message)
        logConsole('error', message)
        continue
      }

      const label = nativeLabel(tab.id)
      const actualUrl = actualUrlsRef.current.get(tab.id)
      if (actualUrl !== tab.url) {
        try {
          await invoke('browser_navigate', { label, url: tab.url })
          actualUrlsRef.current.set(tab.id, tab.url)
        } catch (error) {
          logConsole('error', `Navigation failed: ${String(error)}`)
        }
      }

      if (lastReloadRef.current.get(tab.id) !== tab.reloadNonce) {
        lastReloadRef.current.set(tab.id, tab.reloadNonce)
        try {
          await invoke('browser_reload', { label })
        } catch (error) {
          logConsole('error', `Reload failed: ${String(error)}`)
        }
      }

      if (lastBackRef.current.get(tab.id) !== tab.backNonce) {
        lastBackRef.current.set(tab.id, tab.backNonce)
        try {
          await invoke('browser_back', { label })
        } catch (error) {
          logConsole('error', `Back navigation failed: ${String(error)}`)
        }
      }

      if (lastForwardRef.current.get(tab.id) !== tab.forwardNonce) {
        lastForwardRef.current.set(tab.id, tab.forwardNonce)
        try {
          await invoke('browser_forward', { label })
        } catch (error) {
          logConsole('error', `Forward navigation failed: ${String(error)}`)
        }
      }

      const shouldShow = tab.id === activeTabId && !activePanel
      try {
        if (shouldShow) {
          await webview.setPosition(new LogicalPosition(bounds.x, bounds.y))
          await webview.setSize(new LogicalSize(bounds.width, bounds.height))
          await webview.show()
          await webview.setFocus()
          if (tab.id === activeTabId) setNativeError(null)
        } else {
          await webview.hide()
        }
      } catch (error) {
        logConsole('error', `Could not update native tab view: ${String(error)}`)
      }
    }
  }, [nativeMode, tabs, activeTabId, activePanel, immersive, createNativeView, logConsole])

  const queueNativeSync = useCallback(() => {
    syncQueueRef.current = syncQueueRef.current
      .catch(() => undefined)
      .then(syncNativeViews)
      .catch((error) => {
        const message = `Native browser synchronization failed: ${String(error)}`
        setNativeError(message)
        logConsole('error', message)
      })
  }, [syncNativeViews, logConsole])

  useEffect(() => {
    if (!nativeMode) return
    queueNativeSync()
  }, [nativeMode, tabs, activeTabId, activePanel, immersive, queueNativeSync])

  useEffect(() => {
    if (!nativeMode || !hostRef.current) return
    const observer = new ResizeObserver(queueNativeSync)
    observer.observe(hostRef.current)
    window.addEventListener('resize', queueNativeSync)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', queueNativeSync)
    }
  }, [nativeMode, queueNativeSync])

  useEffect(() => {
    return () => {
      for (const record of nativeViewsRef.current.values()) {
        void record.ready.then((webview) => webview.close()).catch(() => undefined)
      }
      nativeViewsRef.current.clear()
    }
  }, [])

  return (
    <div
      ref={hostRef}
      className={cn('relative min-h-0 flex-1 bg-background', immersive && 'fixed inset-0 z-50')}
    >
      {immersive && <div className="pointer-events-none fixed inset-0 safe-area-inset" />}

      {nativeMode ? (
        <NativeHostBackground activeTab={activeTab} activePanelOpen={Boolean(activePanel)} error={nativeError} />
      ) : (
        <IframeFallback activeTab={activeTab} tabs={tabs} markTabLoaded={markTabLoaded} />
      )}

      {immersive && (
        <button
          type="button"
          onClick={() => setImmersive(false)}
          aria-label="Exit fullscreen"
          className={cn(
            'absolute right-2 top-1 z-10 flex items-center gap-2 rounded-full bg-background/80 px-3 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur transition-opacity duration-300',
            showControls ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        >
          <Minimize className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Exit fullscreen</span>
        </button>
      )}
    </div>
  )
}

function NativeHostBackground({
  activeTab,
  activePanelOpen,
  error,
}: {
  activeTab: Tab
  activePanelOpen: boolean
  error: string | null
}) {
  if (!activeTab.url) return <StartPage />
  if (activePanelOpen) return <div className="size-full bg-background" />

  return (
    <div className="flex size-full items-center justify-center bg-background p-6 text-center">
      <div className="max-w-md rounded-xl border border-border bg-card p-5 shadow-sm">
        <MonitorUp className="mx-auto size-7 text-primary" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium">Opening in the native browser view</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {error ?? 'The page is rendered by Tauri/WebView2 above this content area.'}
        </p>
      </div>
    </div>
  )
}

function IframeFallback({
  activeTab,
  tabs,
  markTabLoaded,
}: {
  activeTab: Tab
  tabs: Tab[]
  markTabLoaded: (tabId: string, url: string) => void
}) {
  return (
    <>
      {tabs.map((tab) => {
        const active = tab.id === activeTab.id
        return (
          <div key={tab.id} className={cn('absolute inset-0', active ? 'block' : 'hidden')}>
            {tab.url ? (
              <>
                <iframe
                  key={`${tab.id}:${tab.reloadNonce}`}
                  src={tab.url}
                  title={tab.title}
                  onLoad={() => markTabLoaded(tab.id, tab.url as string)}
                  className="size-full border-0 bg-white"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads allow-modals allow-pointer-lock"
                  allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />

                {tab.loading && (
                  <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-transparent">
                    <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
                  </div>
                )}

                {active && (
                  <div className="absolute bottom-3 right-3 flex max-w-sm flex-col items-end gap-2">
                    <p className="rounded-lg border border-border bg-background/95 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground shadow-sm backdrop-blur">
                      Web-preview mode uses an iframe. Sites such as Google and YouTube may block embedding. Use the desktop Tauri launcher for real browsing.
                    </p>
                    <a
                      href={tab.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border border-border bg-background/95 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground"
                    >
                      <ExternalLink className="size-3" aria-hidden="true" />
                      Open in system browser
                    </a>
                  </div>
                )}
              </>
            ) : (
              active && <StartPage />
            )}
          </div>
        )
      })}
    </>
  )
}
