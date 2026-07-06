// Hostname rules used by the browser chrome to reject direct navigation.
// Native page request and cosmetic filtering is implemented by src-tauri/src/shields.js.

const AD_DOMAINS = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'adservice.google.com',
  'ads.yahoo.com',
  'adnxs.com',
  'advertising.com',
  'adsrvr.org',
  'criteo.com',
  'taboola.com',
  'outbrain.com',
  'pubmatic.com',
  'rubiconproject.com',
  'openx.net',
  'moatads.com',
  'zedo.com',
  'popads.net',
  'propellerads.com',
  'adcolony.com',
  'mopub.com',
  'mediaplex.com',
  'adtech.de',
  'adform.net',
  'appnexus.com',
  'casalemedia.com',
  'exponential.com',
  'mathtag.com',
  'mookie1.com',
  'netseer.com',
  'sovrn.net',
  'triplelift.com',
  'turn.com',
  'undertone.com',
  'adroll.com',
  'advertisingtech.net',
  'bidder.smartadserver.com',
  'smartadserver.com',
  'yieldlab.de',
  'yieldmo.com',
  'glam.com',
  'yieldkit.com',
]

const TRACKER_DOMAINS = [
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.net',
  'connect.facebook.net',
  'scorecardresearch.com',
  'quantserve.com',
  'hotjar.com',
  'mixpanel.com',
  'segment.io',
  'amplitude.com',
  'branch.io',
  'chartbeat.com',
  'crazyegg.com',
  'mouseflow.com',
  'intercom.io',
  'appcues.com',
  'optimizely.com',
  'newrelic.com',
  'datadog.com',
  'sentry.io',
  'addthis.com',
  'shareaholic.com',
]

function hostMatches(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`)
}

export function isAdUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return AD_DOMAINS.some((domain) => hostMatches(hostname, domain))
  } catch {
    return false
  }
}

export function isTrackerUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return TRACKER_DOMAINS.some((domain) => hostMatches(hostname, domain))
  } catch {
    return false
  }
}

export const BLOCKLIST_SIZE = AD_DOMAINS.length + TRACKER_DOMAINS.length
