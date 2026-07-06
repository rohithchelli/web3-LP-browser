'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_SETTINGS,
  SEARCH_ENGINES,
  type BrowserSettings,
  type ConsoleEntry,
  type HistoryEntry,
  type NativePageLoadEvent,
  type NetworkEntry,
  type Tab,
} from './types'
import { isAdUrl, isTrackerUrl } from './adblock'
import { resolveNavigationInput } from './navigation'

const HISTORY_KEY = 'w3b:history'
const SETTINGS_KEY = 'w3b:settings'

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function newTab(incognito = false): Tab {
  return {
    id: uid(),
    url: null,
    title: incognito ? 'Private Tab' : 'New Tab',
    incognito,
    createdAt: Date.now(),
    loading: false,
    blockedAds: 0,
    reloadNonce: 0,
    backNonce: 0,
    forwardNonce: 0,
  }
}

export function titleFromUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '') || u.href
  } catch {
    return url
  }
}

interface BrowserState {
  tabs: Tab[]
  activeTabId: string
  activeTab: Tab
  history: HistoryEntry[]
  settings: BrowserSettings
  consoleEntries: ConsoleEntry[]
  networkEntries: NetworkEntry[]
  totalBlocked: number
  activePanel: 'history' | 'settings' | 'devtools' | null
  setActivePanel: (p: 'history' | 'settings' | 'devtools' | null) => void
  immersive: boolean
  setImmersive: (v: boolean) => void
  addTab: (incognito?: boolean) => void
  closeTab: (id: string) => void
  setActiveTabId: (id: string) => void
  navigate: (input: string) => void
  goHome: () => void
  goBack: () => void
  goForward: () => void
  reload: () => void
  markTabLoaded: (tabId: string, url: string) => void
  syncNativePageLoad: (event: NativePageLoadEvent) => void
  updateSettings: (patch: Partial<BrowserSettings>) => void
  deleteHistoryEntry: (id: string) => void
  clearHistory: () => void
  logConsole: (level: ConsoleEntry['level'], message: string) => void
  clearConsole: () => void
}

const BrowserContext = createContext<BrowserState | null>(null)

export function BrowserProvider({ children }: { children: ReactNode }) {
  const initialTabRef = useRef<Tab | null>(null)
  if (!initialTabRef.current) initialTabRef.current = newTab()

  const [tabs, setTabs] = useState<Tab[]>(() => [initialTabRef.current as Tab])
  const [activeTabId, setActiveTabId] = useState<string>(() => (initialTabRef.current as Tab).id)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [settings, setSettings] = useState<BrowserSettings>(DEFAULT_SETTINGS)
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([])
  const [networkEntries, setNetworkEntries] = useState<NetworkEntry[]>([])
  const [totalBlocked, setTotalBlocked] = useState(0)
  const [activePanel, setActivePanel] = useState<'history' | 'settings' | 'devtools' | null>(null)
  const [immersive, setImmersive] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const tabsRef = useRef(tabs)
  const settingsRef = useRef(settings)

  useEffect(() => {
    tabsRef.current = tabs
  }, [tabs])

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY)
      if (storedHistory) setHistory(JSON.parse(storedHistory))

      const storedSettings = localStorage.getItem(SETTINGS_KEY)
      if (storedSettings) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) })
    } catch {
      // Ignore corrupt local data and continue with defaults.
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 500)))
  }, [history, hydrated])

  useEffect(() => {
    if (hydrated) localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [settings, hydrated])

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0],
    [tabs, activeTabId],
  )

  const logConsole = useCallback((level: ConsoleEntry['level'], message: string) => {
    setConsoleEntries((previous) => [
      ...previous.slice(-199),
      { id: uid(), level, message, timestamp: Date.now() },
    ])
  }, [])

  const logNetwork = useCallback((url: string, status: NetworkEntry['status']) => {
    setNetworkEntries((previous) => [
      ...previous.slice(-199),
      { id: uid(), url, method: 'GET', status, timestamp: Date.now() },
    ])
  }, [])

  const addTab = useCallback((incognito = false) => {
    const tab = newTab(incognito)
    setTabs((previous) => [...previous, tab])
    setActiveTabId(tab.id)
    setActivePanel(null)
  }, [])

  const closeTab = useCallback(
    (id: string) => {
      setTabs((previous) => {
        const remaining = previous.filter((tab) => tab.id !== id)

        if (remaining.length === 0) {
          const replacement = newTab()
          setActiveTabId(replacement.id)
          return [replacement]
        }

        if (id === activeTabId) {
          const closedIndex = previous.findIndex((tab) => tab.id === id)
          setActiveTabId(remaining[Math.max(0, closedIndex - 1)].id)
        }

        return remaining
      })
    },
    [activeTabId],
  )

  const navigate = useCallback(
    (input: string) => {
      const resolution = resolveNavigationInput(
        input,
        SEARCH_ENGINES[settings.searchEngine].searchUrl,
        settings.httpsOnly,
      )
      if (!resolution) return

      const { url, upgradedToHttps } = resolution
      if (upgradedToHttps) {
        logConsole('info', `HTTPS-only upgraded ${input.trim()} to a secure connection.`)
      }

      const blockedByAdList = settings.adBlockerEnabled && isAdUrl(url)
      const blockedByTrackerList = settings.adBlockerEnabled && settings.blockTrackers && isTrackerUrl(url)

      if (blockedByAdList || blockedByTrackerList) {
        logNetwork(url, 'blocked')
        logConsole('warn', `Blocked direct navigation to a listed ad or tracker host: ${url}`)
        setTotalBlocked((count) => count + 1)
        setTabs((previous) =>
          previous.map((tab) =>
            tab.id === activeTabId ? { ...tab, blockedAds: tab.blockedAds + 1 } : tab,
          ),
        )
        return
      }

      const title = titleFromUrl(url)
      const currentTab = tabsRef.current.find((tab) => tab.id === activeTabId)

      logNetwork(url, 'loading')
      logConsole('log', `Navigating to ${url}`)

      setTabs((previous) =>
        previous.map((tab) =>
          tab.id === activeTabId
            ? { ...tab, url, title, loading: true, blockedAds: 0 }
            : tab,
        ),
      )

      if (settings.saveHistory && currentTab && !currentTab.incognito) {
        setHistory((previous) => [{ id: uid(), url, title, visitedAt: Date.now() }, ...previous])
      }
      setActivePanel(null)
    },
    [activeTabId, settings, logConsole, logNetwork],
  )

  const goHome = useCallback(() => {
    setTabs((previous) =>
      previous.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              url: null,
              title: tab.incognito ? 'Private Tab' : 'New Tab',
              loading: false,
              blockedAds: 0,
            }
          : tab,
      ),
    )
    setActivePanel(null)
  }, [activeTabId])

  const goBack = useCallback(() => {
    if (!activeTab.url) return
    setTabs((previous) =>
      previous.map((tab) =>
        tab.id === activeTabId ? { ...tab, loading: true, backNonce: tab.backNonce + 1 } : tab,
      ),
    )
  }, [activeTab.url, activeTabId])

  const goForward = useCallback(() => {
    if (!activeTab.url) return
    setTabs((previous) =>
      previous.map((tab) =>
        tab.id === activeTabId ? { ...tab, loading: true, forwardNonce: tab.forwardNonce + 1 } : tab,
      ),
    )
  }, [activeTab.url, activeTabId])

  const reload = useCallback(() => {
    if (!activeTab.url) return

    logNetwork(activeTab.url, 'loading')
    logConsole('log', `Reloading ${activeTab.url}`)
    setTabs((previous) =>
      previous.map((tab) =>
        tab.id === activeTabId
          ? { ...tab, loading: true, reloadNonce: tab.reloadNonce + 1 }
          : tab,
      ),
    )
  }, [activeTab.url, activeTabId, logConsole, logNetwork])

  const markTabLoaded = useCallback(
    (tabId: string, url: string) => {
      setTabs((previous) =>
        previous.map((tab) => (tab.id === tabId ? { ...tab, loading: false } : tab)),
      )
      logNetwork(url, 'done')
    },
    [logNetwork],
  )

  const syncNativePageLoad = useCallback(
    (event: NativePageLoadEvent) => {
      const tabId = event.label.startsWith('browser-tab-') ? event.label.slice('browser-tab-'.length) : null
      if (!tabId) return

      const existing = tabsRef.current.find((tab) => tab.id === tabId)
      if (!existing) return

      const changedUrl = existing.url !== event.url
      const title = event.title?.trim() || titleFromUrl(event.url)

      setTabs((previous) =>
        previous.map((tab) =>
          tab.id === tabId
            ? {
                ...tab,
                url: event.url,
                title: event.status === 'finished' ? title : tab.title || title,
                loading: event.status === 'started',
              }
            : tab,
        ),
      )

      if (event.status === 'started') {
        logNetwork(event.url, 'loading')
        if (changedUrl && settingsRef.current.saveHistory && !existing.incognito) {
          setHistory((previous) => [
            { id: uid(), url: event.url, title: titleFromUrl(event.url), visitedAt: Date.now() },
            ...previous,
          ])
        }
      } else {
        logNetwork(event.url, 'done')
      }
    },
    [logNetwork],
  )

  const updateSettings = useCallback((patch: Partial<BrowserSettings>) => {
    setSettings((previous) => ({ ...previous, ...patch }))
  }, [])

  const deleteHistoryEntry = useCallback((id: string) => {
    setHistory((previous) => previous.filter((entry) => entry.id !== id))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const clearConsole = useCallback(() => {
    setConsoleEntries([])
    setNetworkEntries([])
  }, [])

  const value: BrowserState = {
    tabs,
    activeTabId,
    activeTab,
    history,
    settings,
    consoleEntries,
    networkEntries,
    totalBlocked,
    activePanel,
    setActivePanel,
    immersive,
    setImmersive,
    addTab,
    closeTab,
    setActiveTabId,
    navigate,
    goHome,
    goBack,
    goForward,
    reload,
    markTabLoaded,
    syncNativePageLoad,
    updateSettings,
    deleteHistoryEntry,
    clearHistory,
    logConsole,
    clearConsole,
  }

  return <BrowserContext.Provider value={value}>{children}</BrowserContext.Provider>
}

export function useBrowser() {
  const context = useContext(BrowserContext)
  if (!context) throw new Error('useBrowser must be used within BrowserProvider')
  return context
}
