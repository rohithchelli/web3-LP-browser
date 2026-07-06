'use client'

import { useEffect } from 'react'
import { useBrowser } from '@/lib/browser/store'
import { TabStrip } from './tab-strip'
import { Toolbar } from './toolbar'
import { WebView } from './webview'
import { HistoryPanel } from './history-panel'
import { SettingsPanel } from './settings-panel'
import { DevToolsPanel } from './devtools-panel'
import { cn } from '@/lib/utils'

export function BrowserShell() {
  const { activePanel, setActivePanel, immersive } = useBrowser()

  useEffect(() => {
    if (!activePanel) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePanel(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activePanel, setActivePanel])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-sidebar">
      {!immersive && (
        <header className="shrink-0">
          <TabStrip />
          <Toolbar />
        </header>
      )}

      <main className="relative flex min-h-0 flex-1">
        <WebView />

        {/* Side panel — sidebar on desktop, overlay sheet on mobile */}
        {activePanel && !immersive && (
          <>
            <button
              type="button"
              aria-label="Close panel"
              onClick={() => setActivePanel(null)}
              className="absolute inset-0 z-30 bg-foreground/20 backdrop-blur-[2px] md:hidden"
            />
            <aside
              aria-label={`${activePanel} panel`}
              className={cn(
                'z-40 flex flex-col border-border bg-background',
                'absolute inset-y-0 right-0 w-full max-w-sm border-l shadow-2xl',
                'md:static md:w-96 md:max-w-none md:shadow-none',
              )}
            >
              {activePanel === 'history' && <HistoryPanel />}
              {activePanel === 'settings' && <SettingsPanel />}
              {activePanel === 'devtools' && <DevToolsPanel />}
            </aside>
          </>
        )}
      </main>
    </div>
  )
}
