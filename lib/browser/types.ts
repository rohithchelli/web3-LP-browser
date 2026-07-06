export type SearchEngine = 'brave' | 'google'

export interface Tab {
  id: string
  url: string | null // null = start page (new tab)
  title: string
  incognito: boolean
  createdAt: number
  loading: boolean
  blockedAds: number
  reloadNonce: number
  backNonce: number
  forwardNonce: number
}

export interface HistoryEntry {
  id: string
  url: string
  title: string
  visitedAt: number
}

export interface BrowserSettings {
  searchEngine: SearchEngine
  adBlockerEnabled: boolean
  blockTrackers: boolean
  fastForwardYoutubeAds: boolean
  httpsOnly: boolean
  saveHistory: boolean
}

export interface ConsoleEntry {
  id: string
  level: 'log' | 'warn' | 'error' | 'info'
  message: string
  timestamp: number
}

export interface NetworkEntry {
  id: string
  url: string
  method: string
  status: 'loading' | 'done' | 'blocked'
  timestamp: number
}

export interface NativePageLoadEvent {
  label: string
  url: string
  status: 'started' | 'finished'
  title?: string | null
}

export const SEARCH_ENGINES: Record<SearchEngine, { name: string; searchUrl: string; home: string }> = {
  brave: {
    name: 'Brave Search',
    searchUrl: 'https://search.brave.com/search?q=',
    home: 'https://search.brave.com',
  },
  google: {
    name: 'Google',
    searchUrl: 'https://www.google.com/search?q=',
    home: 'https://www.google.com',
  },
}

export const DEFAULT_SETTINGS: BrowserSettings = {
  searchEngine: 'brave',
  adBlockerEnabled: true,
  blockTrackers: true,
  fastForwardYoutubeAds: true,
  httpsOnly: true,
  saveHistory: true,
}
