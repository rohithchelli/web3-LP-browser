import { isTauri } from '@tauri-apps/api/core'

export const NATIVE_TAB_PREFIX = 'browser-tab-'

export function nativeLabel(tabId: string) {
  return `${NATIVE_TAB_PREFIX}${tabId}`
}

export function tabIdFromNativeLabel(label: string) {
  return label.startsWith(NATIVE_TAB_PREFIX) ? label.slice(NATIVE_TAB_PREFIX.length) : null
}

export function isNativeDesktop() {
  return typeof window !== 'undefined' && isTauri()
}
