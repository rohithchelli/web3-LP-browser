export interface NavigationResolution {
  url: string
  upgradedToHttps: boolean
  kind: 'url' | 'search'
}

const HOST_WITH_OPTIONAL_PORT = /^(?:localhost|(?:\d{1,3}\.){3}\d{1,3}|(?:[a-z\d-]+\.)+[a-z\d-]{2,})(?::\d{1,5})?(?:[/?#].*)?$/i
const LOCAL_HOST_INPUT = /^(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?::\d{1,5})?(?:[/?#].*)?$/i

function isLocalHttpUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname
    if (hostname === 'localhost' || hostname === '::1') return true
    if (/^127\./.test(hostname) || /^10\./.test(hostname) || /^192\.168\./.test(hostname)) return true
    const match = hostname.match(/^172\.(\d+)\./)
    return match ? Number(match[1]) >= 16 && Number(match[1]) <= 31 : false
  } catch {
    return false
  }
}

export function resolveNavigationInput(
  input: string,
  searchUrl: string,
  httpsOnly: boolean,
): NavigationResolution | null {
  const raw = input.trim()
  if (!raw) return null

  const isHttpUrl = /^https?:\/\//i.test(raw)
  const looksLikeHost = !raw.includes(' ') && HOST_WITH_OPTIONAL_PORT.test(raw)

  let url: string
  let kind: NavigationResolution['kind']

  if (isHttpUrl) {
    url = raw
    kind = 'url'
  } else if (looksLikeHost) {
    url = `${LOCAL_HOST_INPUT.test(raw) ? 'http' : 'https'}://${raw}`
    kind = 'url'
  } else {
    url = `${searchUrl}${encodeURIComponent(raw)}`
    kind = 'search'
  }

  const upgradedToHttps = httpsOnly && url.startsWith('http://') && !isLocalHttpUrl(url)
  if (upgradedToHttps) url = url.replace(/^http:\/\//, 'https://')

  return { url, upgradedToHttps, kind }
}
