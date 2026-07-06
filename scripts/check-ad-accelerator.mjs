import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = readFileSync(resolve(root, 'src-tauri/src/shields.js'), 'utf8')
  .replaceAll('__W3B_ENABLED__', 'true')
  .replaceAll('__W3B_BLOCK_TRACKERS__', 'true')
  .replaceAll('__W3B_FAST_FORWARD_YOUTUBE_ADS__', 'true')

class FakeStyle {
  getPropertyValue() { return '' }
  getPropertyPriority() { return '' }
  setProperty() {}
  removeProperty() {}
}

class FakeElement {
  constructor() {
    this.style = new FakeStyle()
    this.isConnected = true
    this.attributes = new Map()
    this.visible = true
    this.classNames = new Set()
    this.classList = { contains: (name) => this.classNames.has(name) }
  }
  getBoundingClientRect() { return this.visible ? { width: 100, height: 20 } : { width: 0, height: 0 } }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null }
  setAttribute(name, value) { this.attributes.set(name, String(value)) }
  removeAttribute(name) { this.attributes.delete(name) }
  hasAttribute(name) { return this.attributes.has(name) }
  matches() { return false }
  querySelector() { return null }
  querySelectorAll() { return [] }
  addEventListener() {}
  removeEventListener() {}
  click() {}
  remove() { this.isConnected = false }
}
class FakeHTMLElement extends FakeElement {}
class FakeSVGElement extends FakeElement {}
class FakeVideo extends FakeHTMLElement {
  constructor(duration, rate = 1) {
    super()
    this.duration = duration
    this.playbackRate = rate
    this.defaultPlaybackRate = rate
    this.listeners = new Map()
  }
  addEventListener(name, handler) { this.listeners.set(name, handler) }
  removeEventListener(name) { this.listeners.delete(name) }
  emit(name) { this.listeners.get(name)?.() }
}
class FakeMutationObserver {
  constructor(callback) { this.callback = callback }
  observe() {}
  disconnect() {}
}

const evidence = new FakeHTMLElement()
let currentVideo = new FakeVideo(15, 1.5)
const player = new FakeHTMLElement()
player.classNames.add('ad-showing')
player.querySelector = (selector) => selector.includes('video') ? currentVideo : null
player.querySelectorAll = (selector) => selector === '.ytp-ad-text' ? [evidence] : []

const document = {
  baseURI: 'https://www.youtube.com/watch?v=test',
  documentElement: null,
  head: null,
  addEventListener() {},
  querySelector(selector) { return selector === '#movie_player' ? player : null },
  querySelectorAll() { return [] },
  createElement() { return new FakeHTMLElement() },
}
const windowObject = {
  location: { hostname: 'www.youtube.com', href: document.baseURI },
  getComputedStyle(element) {
    return {
      display: element.visible ? 'block' : 'none',
      visibility: element.visible ? 'visible' : 'hidden',
      opacity: element.visible ? '1' : '0',
    }
  },
  fetch() { return Promise.resolve() },
  open() {},
  XMLHttpRequest: class { open() {} },
}

const context = {
  window: windowObject,
  document,
  Element: FakeElement,
  HTMLElement: FakeHTMLElement,
  SVGElement: FakeSVGElement,
  HTMLVideoElement: FakeVideo,
  MutationObserver: FakeMutationObserver,
  XMLHttpRequest: windowObject.XMLHttpRequest,
  Request: class Request { constructor(url) { this.url = url } },
  URL,
  TypeError,
  Promise,
  Map,
  Set,
  WeakMap,
  Array,
  Object,
  Number,
  String,
  Boolean,
  Date,
  clearInterval() {},
  setInterval() { return 1 },
  console,
}
windowObject.window = windowObject
windowObject.document = document
windowObject.Element = FakeElement
windowObject.HTMLElement = FakeHTMLElement
windowObject.SVGElement = FakeSVGElement
windowObject.HTMLVideoElement = FakeVideo
windowObject.MutationObserver = FakeMutationObserver
windowObject.XMLHttpRequest = context.XMLHttpRequest
windowObject.Request = context.Request

vm.runInNewContext(source, context, { filename: 'shields.js' })
const shield = windowObject.__web3BrowserShieldsV4
if (!shield) throw new Error('Shield state was not initialized')

const assert = (condition, label) => {
  if (!condition) throw new Error(`FAIL: ${label}`)
  console.log(`PASS  ${label}`)
}

// One observation is not enough.
shield.evaluateYouTubeAdPlayback()
assert(currentVideo.playbackRate === 1.5, 'First ad observation does not accelerate')

// Two strong observations accelerate a short verified ad.
shield.evaluateYouTubeAdPlayback()
assert(currentVideo.playbackRate === 8, 'Confirmed short video ad accelerates to 8x')

// Removing YouTube's ad state restores the user's original speed immediately.
player.classNames.delete('ad-showing')
shield.evaluateYouTubeAdPlayback()
assert(currentVideo.playbackRate === 1.5, 'Normal playback speed is restored when ad state ends')

// Visible ad UI without the player ad state is insufficient.
shield.evaluateYouTubeAdPlayback()
shield.evaluateYouTubeAdPlayback()
assert(currentVideo.playbackRate === 1.5, 'Ad UI alone cannot accelerate normal video')

// Long media is not accelerated even if stale ad markers exist.
player.classNames.add('ad-showing')
currentVideo = new FakeVideo(240, 1.25)
shield.youtube.cooldownUntil = 0
shield.evaluateYouTubeAdPlayback()
shield.evaluateYouTubeAdPlayback()
assert(currentVideo.playbackRate === 1.25, 'Long media is never accelerated')

// A media boundary restores speed and starts the safety cooldown.
currentVideo = new FakeVideo(20, 1.75)
shield.youtube.cooldownUntil = 0
shield.evaluateYouTubeAdPlayback()
shield.evaluateYouTubeAdPlayback()
assert(currentVideo.playbackRate === 8, 'Second verified short ad accelerates')
currentVideo.emit('loadstart')
assert(currentVideo.playbackRate === 1.75, 'Media boundary immediately restores playback speed')
assert(shield.youtube.cooldownUntil > Date.now(), 'Media boundary starts a safety cooldown')

console.log('\nAd accelerator behavioral checks passed.')
