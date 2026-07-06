import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const rust = readFileSync(resolve(root, 'src-tauri/src/lib.rs'), 'utf8')
const script = readFileSync(resolve(root, 'src-tauri/src/shields.js'), 'utf8')
const webview = readFileSync(resolve(root, 'components/browser/webview.tsx'), 'utf8')
const settings = readFileSync(resolve(root, 'components/browser/settings-panel.tsx'), 'utf8')
const types = readFileSync(resolve(root, 'lib/browser/types.ts'), 'utf8')

const checks = [
  [rust.includes('include_str!("shields.js")'), 'Rust embeds the shield script'],
  [rust.includes('browser_set_shields'), 'Rust exposes shield settings'],
  [rust.includes('browser_apply_shields'), 'Rust exposes shield application'],
  [rust.includes('fast_forward_youtube_ads'), 'Rust stores the YouTube ad-accelerator setting'],
  [rust.includes('__W3B_FAST_FORWARD_YOUTUBE_ADS__'), 'Rust injects the ad-accelerator setting'],
  [rust.includes('.initialization_script('), 'Shields run before remote page scripts'],
  [rust.includes('.on_page_load'), 'Shields reapply during native page loads'],
  [script.includes('MutationObserver'), 'Dynamic ad containers and player state are observed'],
  [script.includes('window.fetch = function'), 'Fetch requests are filtered'],
  [script.includes('XMLHttpRequest.prototype.open'), 'XHR requests are filtered'],
  [script.includes('googlesyndication.com'), 'Known ad hosts are included'],
  [script.includes('ytp-ad-skip-button'), 'YouTube Skip Ad controls are handled'],
  [script.includes('ytp-ad-overlay-close-button'), 'YouTube Close Ad controls are handled'],
  [script.includes('ytd-promoted-video-renderer'), 'YouTube promoted cards are hidden'],
  [script.includes("classList.contains('ad-showing')"), 'Acceleration requires YouTube ad-showing state'],
  [script.includes('YOUTUBE_VIDEO_AD_EVIDENCE_SELECTORS'), 'Acceleration also requires visible ad-only UI'],
  [script.includes('YOUTUBE_AD_CONFIRM_TICKS = 2'), 'Ad state must be confirmed more than once'],
  [script.includes('YOUTUBE_MEDIA_CHANGE_COOLDOWN_MS = 1000'), 'Media changes enforce a one-second safety cooldown'],
  [script.includes('YOUTUBE_MAX_ACCELERATED_AD_SECONDS = 180'), 'Only short ad-like media can be accelerated'],
  [script.includes('handleYouTubeMediaBoundary'), 'Media/source transitions immediately stop acceleration'],
  [script.includes('video.playbackRate = YOUTUBE_AD_RATE'), 'Verified video ads are accelerated'],
  [script.includes('video.playbackRate = session.restoreRate'), 'Original playback speed is restored'],
  [!script.includes('video.currentTime'), 'Shields never seek the video timeline'],
  [!script.includes('video.muted ='), 'Shields never change video mute state'],
  [!script.includes('video.volume ='), 'Shields never change video volume'],
  [!script.includes('.play('), 'Shields never force media playback'],
  [!script.includes('.pause('), 'Shields never pause media playback'],
  [!script.includes('button[aria-label^="Skip"]'), 'Broad non-ad Skip buttons are not clicked'],
  [types.includes('fastForwardYoutubeAds: boolean'), 'Browser settings persist the accelerator toggle'],
  [webview.includes('fastForwardYoutubeAds: settings.fastForwardYoutubeAds'), 'Frontend syncs the accelerator setting to Rust'],
  [settings.includes('label="Fast-forward YouTube video ads"'), 'Settings expose the guarded accelerator toggle'],
  [webview.includes("invoke('browser_create_webview'"), 'Frontend requests Rust-created child webviews'],
  [webview.includes("invoke('browser_set_shields'"), 'Frontend syncs saved settings to Rust'],
  [webview.includes("invoke('browser_apply_shields'"), 'Frontend applies shields to child webviews'],
  [settings.includes('label="Browser shields"'), 'Settings expose a compatibility toggle'],
]

const failed = checks.filter(([ok]) => !ok)
for (const [ok, label] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
if (failed.length) process.exit(1)
console.log(`\n${checks.length} shield safety and wiring checks passed.`)
