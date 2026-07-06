'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Globe,
  Home,
  Lock,
  Maximize,
  Moon,
  MoreVertical,
  RotateCw,
  Search,
  Settings,
  ShieldCheck,
  ShieldOff,
  SquareCode,
  Sun,
  VenetianMask,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useBrowser } from '@/lib/browser/store'
import { SEARCH_ENGINES } from '@/lib/browser/types'
import { cn } from '@/lib/utils'

export function Toolbar() {
  const {
    activeTab,
    navigate,
    goHome,
    goBack,
    goForward,
    reload,
    settings,
    activePanel,
    setActivePanel,
    addTab,
    setImmersive,
    totalBlocked,
  } = useBrowser()
  const { resolvedTheme, setTheme } = useTheme()
  const [value, setValue] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    setValue(activeTab.url ?? '')
  }, [activeTab.id, activeTab.url])

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const togglePanel = (p: 'history' | 'settings' | 'devtools') => {
    setActivePanel(activePanel === p ? null : p)
    setMenuOpen(false)
  }

  const iconBtn =
    'flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40'

  return (
    <div className="flex items-center gap-1 border-b border-border bg-background px-2 py-1.5">
      <button type="button" onClick={goBack} aria-label="Back" title="Back" className={iconBtn} disabled={!activeTab.url}>
        <ArrowLeft className="size-4" />
      </button>
      <button type="button" onClick={goForward} aria-label="Forward" title="Forward" className={iconBtn} disabled={!activeTab.url}>
        <ArrowRight className="size-4" />
      </button>
      <button type="button" onClick={goHome} aria-label="Home" title="Home" className={iconBtn}>
        <Home className="size-4" />
      </button>
      <button type="button" onClick={reload} aria-label="Reload page" className={iconBtn} disabled={!activeTab.url}>
        <RotateCw className={cn('size-4', activeTab.loading && 'animate-spin')} />
      </button>

      {/* Address bar */}
      <form
        className="min-w-0 flex-1"
        onSubmit={(e) => {
          e.preventDefault()
          navigate(value)
        }}
      >
        <div
          className={cn(
            'flex h-9 items-center gap-2 rounded-full border border-input bg-secondary/50 px-3 transition-colors focus-within:border-ring focus-within:bg-background',
            activeTab.incognito && 'border-accent-foreground/30 bg-accent/40',
          )}
        >
          {activeTab.incognito ? (
            <VenetianMask className="size-3.5 shrink-0 text-accent-foreground" aria-label="Private tab" />
          ) : activeTab.url?.startsWith('https://') ? (
            <Lock className="size-3.5 shrink-0 text-primary" aria-label="HTTPS connection" />
          ) : activeTab.url ? (
            <Globe className="size-3.5 shrink-0 text-muted-foreground" aria-label="Non-HTTPS or local address" />
          ) : (
            <Search className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder={`Search ${SEARCH_ENGINES[settings.searchEngine].name} or type a URL`}
            aria-label="Address and search bar"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {/* Browser shields status */}
          <span
            title={settings.adBlockerEnabled ? 'Browser shields are active' : 'Browser shields are off'}
            className={cn(
              'flex items-center gap-1 text-xs font-medium tabular-nums',
              settings.adBlockerEnabled ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {settings.adBlockerEnabled ? <ShieldCheck className="size-3.5" /> : <ShieldOff className="size-3.5" />}
            <span className="hidden sm:inline">{settings.adBlockerEnabled ? 'On' : ''}</span>
            <span className="sr-only">
              {settings.adBlockerEnabled ? `Browser shields active; ${totalBlocked} blocked direct navigations` : 'Browser shields disabled'}
            </span>
          </span>
        </div>
      </form>

      {/* Desktop actions */}
      <div className="hidden items-center gap-1 md:flex">
        <button
          type="button"
          onClick={() => addTab(true)}
          aria-label="New private tab"
          title="New private tab"
          className={iconBtn}
        >
          <VenetianMask className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => togglePanel('history')}
          aria-label="History"
          title="History"
          className={cn(iconBtn, activePanel === 'history' && 'bg-secondary text-foreground')}
        >
          <Clock className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => togglePanel('devtools')}
          aria-label="Developer tools"
          title="Developer tools"
          className={cn(iconBtn, activePanel === 'devtools' && 'bg-secondary text-foreground')}
        >
          <SquareCode className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setImmersive(true)}
          aria-label="Enter fullscreen"
          title="Fullscreen"
          className={iconBtn}
          disabled={!activeTab.url}
        >
          <Maximize className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
          title="Toggle theme"
          className={iconBtn}
        >
          {mounted && resolvedTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
        <button
          type="button"
          onClick={() => togglePanel('settings')}
          aria-label="Settings"
          title="Settings"
          className={cn(iconBtn, activePanel === 'settings' && 'bg-secondary text-foreground')}
        >
          <Settings className="size-4" />
        </button>
      </div>

      {/* Mobile menu */}
      <div className="relative md:hidden" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Browser menu"
          aria-expanded={menuOpen}
          className={iconBtn}
        >
          <MoreVertical className="size-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-10 z-50 w-56 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg">
            <MenuItem
              icon={<VenetianMask className="size-4" />}
              label="New private tab"
              onClick={() => {
                addTab(true)
                setMenuOpen(false)
              }}
            />
            <MenuItem icon={<Clock className="size-4" />} label="History" onClick={() => togglePanel('history')} />
            <MenuItem
              icon={<SquareCode className="size-4" />}
              label="Developer tools"
              onClick={() => togglePanel('devtools')}
            />
            {activeTab.url && (
              <MenuItem
                icon={<Maximize className="size-4" />}
                label="Fullscreen"
                onClick={() => {
                  setImmersive(true)
                  setMenuOpen(false)
                }}
              />
            )}
            <MenuItem
              icon={mounted && resolvedTheme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
              label={mounted && resolvedTheme === 'dark' ? 'Light theme' : 'Dark theme'}
              onClick={() => {
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
                setMenuOpen(false)
              }}
            />
            <MenuItem icon={<Settings className="size-4" />} label="Settings" onClick={() => togglePanel('settings')} />
          </div>
        )}
      </div>
    </div>
  )
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary"
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </button>
  )
}
