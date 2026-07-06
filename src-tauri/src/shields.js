(() => {
  'use strict';

  const enabled = __W3B_ENABLED__;
  const blockTrackers = __W3B_BLOCK_TRACKERS__;
  const fastForwardYoutubeAds = __W3B_FAST_FORWARD_YOUTUBE_ADS__;
  const key = '__web3BrowserShieldsV4';
  const legacyKeys = ['__web3BrowserShieldsV3', '__web3BrowserShieldsV2'];

  const AD_HOSTS = [
    '2mdn.net',
    'ad.doubleclick.net',
    'adform.net',
    'adnxs.com',
    'adroll.com',
    'ads-twitter.com',
    'adsafeprotected.com',
    'adsrvr.org',
    'advertising.com',
    'amazon-adsystem.com',
    'appnexus.com',
    'casalemedia.com',
    'criteo.com',
    'criteo.net',
    'doubleclick.net',
    'exponential.com',
    'googleadservices.com',
    'googlesyndication.com',
    'gumgum.com',
    'lijit.com',
    'media.net',
    'moatads.com',
    'mookie1.com',
    'openx.net',
    'outbrain.com',
    'popads.net',
    'propellerads.com',
    'pubmatic.com',
    'revcontent.com',
    'rubiconproject.com',
    'smartadserver.com',
    'sovrn.com',
    'taboola.com',
    'triplelift.com',
    'undertone.com',
    'yieldmo.com',
    'zedo.com'
  ];

  const TRACKER_HOSTS = [
    'addthis.com',
    'amplitude.com',
    'branch.io',
    'chartbeat.com',
    'clarity.ms',
    'connect.facebook.net',
    'crazyegg.com',
    'datadoghq.com',
    'facebook.net',
    'fullstory.com',
    'google-analytics.com',
    'googletagmanager.com',
    'hotjar.com',
    'intercom.io',
    'mixpanel.com',
    'mouseflow.com',
    'newrelic.com',
    'optimizely.com',
    'quantserve.com',
    'scorecardresearch.com',
    'segment.com',
    'segment.io',
    'sentry.io',
    'shareaholic.com'
  ];

  const HIDE_SELECTORS = [
    '.adsbygoogle',
    '[data-ad-client]',
    '[data-ad-slot]',
    '[id^="google_ads_"]',
    '[id*="div-gpt-ad"]',
    'iframe[src*="doubleclick.net"]',
    'iframe[src*="googlesyndication.com"]',
    '.ad-container',
    '.ad-banner',
    '.advertisement',
    '.sponsored-ad',

    // YouTube page, feed, masthead, companion and overlay ads.
    // Do not hide the complete in-player ad module: the ad accelerator needs
    // visible, ad-specific evidence before it may change playback speed.
    '#masthead-ad',
    '#player-ads',
    '.ytp-ad-overlay-container',
    'ytd-ad-slot-renderer',
    'ytd-banner-promo-renderer',
    'ytd-brand-video-singleton-renderer',
    'ytd-compact-promoted-video-renderer',
    'ytd-display-ad-renderer',
    'ytd-in-feed-ad-layout-renderer',
    'ytd-masthead-ad-v3-renderer',
    'ytd-promoted-sparkles-text-search-renderer',
    'ytd-promoted-sparkles-web-renderer',
    'ytd-promoted-video-renderer',
    'ytd-search-pyv-renderer',
    'ytd-statement-banner-renderer',
    'ytd-video-masthead-ad-advertiser-info-renderer',
    'ytd-video-masthead-ad-primary-video-renderer',
    'ytd-video-masthead-ad-v3-renderer',
    'ytm-promoted-sparkles-web-renderer',
    'ytm-promoted-video-renderer'
  ];

  const SKIP_SELECTORS = [
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-skip-ad-button',
    'button[class*="ytp-ad-skip"]',
    'button[aria-label="Skip ad"]',
    'button[aria-label^="Skip ad"]',
    'button[aria-label*="Skip Ad"]'
  ];

  const CLOSE_AD_SELECTORS = [
    '.ytp-ad-overlay-close-button',
    'button[aria-label="Close ad"]',
    'button[aria-label*="Close ad"]'
  ];

  // The accelerator requires both YouTube's player ad state and at least one
  // visible ad-only control/badge. The class alone is not trusted because it
  // can remain briefly after the requested video starts.
  const YOUTUBE_VIDEO_AD_EVIDENCE_SELECTORS = [
    '.ytp-ad-text',
    '.ytp-ad-simple-ad-badge',
    '.ytp-ad-preview-container',
    '.ytp-ad-duration-remaining',
    '.ytp-ad-message-container',
    '.ytp-ad-skip-button-container',
    '.ytp-ad-player-overlay',
    '.ytp-ad-action-interstitial'
  ];

  const YOUTUBE_AD_RATE = 8;
  const YOUTUBE_AD_CONFIRM_TICKS = 2;
  const YOUTUBE_MEDIA_CHANGE_COOLDOWN_MS = 1000;
  const YOUTUBE_MAX_ACCELERATED_AD_SECONDS = 180;

  const normalizeHost = (hostname) => String(hostname || '').toLowerCase().replace(/^www\./, '');
  const hostMatches = (hostname, domain) => hostname === domain || hostname.endsWith(`.${domain}`);
  const isYouTube = () => {
    const host = normalizeHost(window.location.hostname);
    return host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be';
  };

  const urlHost = (input) => {
    try {
      const raw = typeof Request !== 'undefined' && input instanceof Request ? input.url : String(input || '');
      return normalizeHost(new URL(raw, document.baseURI || window.location.href).hostname);
    } catch {
      return '';
    }
  };

  const isVisible = (element) => {
    if (!(element instanceof Element) || !element.isConnected) return false;
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  for (const legacyKey of legacyKeys) {
    try {
      const legacyState = window[legacyKey];
      if (legacyState && typeof legacyState.stop === 'function') legacyState.stop();
    } catch {
      // A page can restrict access to injected globals; continue safely.
    }
  }

  const state = window[key] || {
    enabled: false,
    blockTrackers: false,
    fastForwardYoutubeAds: false,
    observer: null,
    maintenanceTimer: null,
    style: null,
    hiddenElements: new Map(),
    originals: {},
    patched: false,
    youtube: {
      active: false,
      video: null,
      restoreRate: 1,
      confirmationTicks: 0,
      cooldownUntil: 0,
      player: null,
      playerObserver: null,
      boundVideo: null,
      mediaBoundaryHandler: null
    },
    stats: {
      blockedRequests: 0,
      hiddenElements: 0,
      skippedVideoAds: 0,
      acceleratedVideoAds: 0
    },
    isBlocked(input) {
      if (!this.enabled) return false;
      const host = urlHost(input);
      if (!host) return false;
      if (AD_HOSTS.some((domain) => hostMatches(host, domain))) return true;
      return this.blockTrackers && TRACKER_HOSTS.some((domain) => hostMatches(host, domain));
    },
    recordBlockedRequest() {
      this.stats.blockedRequests += 1;
    },
    hideElement(element) {
      if (!(element instanceof HTMLElement || element instanceof SVGElement)) return;
      if (!this.hiddenElements.has(element)) {
        this.hiddenElements.set(element, {
          display: element.style.getPropertyValue('display'),
          displayPriority: element.style.getPropertyPriority('display'),
          visibility: element.style.getPropertyValue('visibility'),
          visibilityPriority: element.style.getPropertyPriority('visibility'),
          ariaHidden: element.getAttribute('aria-hidden')
        });
        this.stats.hiddenElements += 1;
      }
      element.style.setProperty('display', 'none', 'important');
      element.style.setProperty('visibility', 'hidden', 'important');
      element.setAttribute('aria-hidden', 'true');
    },
    restoreHiddenElements() {
      for (const [element, previous] of this.hiddenElements.entries()) {
        if (!element?.isConnected) continue;
        if (previous.display) element.style.setProperty('display', previous.display, previous.displayPriority);
        else element.style.removeProperty('display');
        if (previous.visibility) element.style.setProperty('visibility', previous.visibility, previous.visibilityPriority);
        else element.style.removeProperty('visibility');
        if (previous.ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', previous.ariaHidden);
      }
      this.hiddenElements.clear();
    },
    scan(root = document) {
      if (!this.enabled || !root || typeof root.querySelectorAll !== 'function') return;

      for (const selector of HIDE_SELECTORS) {
        try {
          root.querySelectorAll(selector).forEach((element) => this.hideElement(element));
          if (root instanceof Element && root.matches?.(selector)) this.hideElement(root);
        } catch {
          // Ignore site-specific selector wrappers and continue with the rest.
        }
      }

      const candidates = root.querySelectorAll('script[src], iframe[src], img[src], source[src], link[href]');
      candidates.forEach((element) => {
        const candidate = element.getAttribute('src') || element.getAttribute('href');
        if (!candidate || !this.isBlocked(candidate)) return;

        this.recordBlockedRequest();
        const tag = element.tagName.toLowerCase();
        if (tag === 'script' || tag === 'iframe' || tag === 'link') {
          element.remove();
        } else {
          this.hideElement(element);
        }
      });

      if (isYouTube()) this.hideYouTubeSponsoredRenderers(root);
    },
    hideYouTubeSponsoredRenderers(root = document) {
      if (!this.enabled || !isYouTube() || !root || typeof root.querySelectorAll !== 'function') return;

      const renderers = root.querySelectorAll([
        'ytd-rich-item-renderer',
        'ytd-compact-video-renderer',
        'ytd-video-renderer',
        'ytd-item-section-renderer'
      ].join(','));

      renderers.forEach((renderer) => {
        const containsAdBadge = renderer.querySelector([
          'ytd-ad-badge-renderer',
          '[aria-label="Sponsored"]',
          '[aria-label^="Sponsored"]',
          '[class*="badge-style-type-ad"]'
        ].join(','));
        if (containsAdBadge) this.hideElement(renderer);
      });
    },
    clickFirst(selectors) {
      for (const selector of selectors) {
        const candidate = document.querySelector(selector);
        if (candidate instanceof HTMLElement && !candidate.hasAttribute('disabled') && isVisible(candidate)) {
          candidate.click();
          return true;
        }
      }
      return false;
    },
    getYouTubePlayer() {
      const player = document.querySelector('#movie_player');
      return player instanceof HTMLElement ? player : null;
    },
    getYouTubeVideo(player = this.getYouTubePlayer()) {
      if (!player) return null;
      const video = player.querySelector('video.html5-main-video, video');
      return video instanceof HTMLVideoElement ? video : null;
    },
    hasStrongYouTubeAdEvidence(player = this.getYouTubePlayer()) {
      if (!player || !player.classList.contains('ad-showing')) return false;
      return YOUTUBE_VIDEO_AD_EVIDENCE_SELECTORS.some((selector) => {
        try {
          return Array.from(player.querySelectorAll(selector)).some(isVisible);
        } catch {
          return false;
        }
      });
    },
    isLikelyYouTubeAdMedia(video) {
      if (!(video instanceof HTMLVideoElement)) return false;
      const duration = Number(video.duration);
      return Number.isFinite(duration) && duration > 0 && duration <= YOUTUBE_MAX_ACCELERATED_AD_SECONDS;
    },
    restoreYouTubePlayback() {
      const session = this.youtube;
      session.confirmationTicks = 0;
      if (!session.active) return;

      const video = session.video;
      session.active = false;
      session.video = null;

      if (video instanceof HTMLVideoElement && Number.isFinite(session.restoreRate) && session.restoreRate > 0) {
        try {
          video.playbackRate = session.restoreRate;
        } catch {
          // The media element may have been replaced during navigation.
        }
      }
    },
    handleYouTubeMediaBoundary() {
      // A load/source boundary can be the transition from an ad to the actual
      // video. Restore before considering any new acceleration, then require
      // fresh ad evidence for multiple checks.
      this.restoreYouTubePlayback();
      this.youtube.cooldownUntil = Date.now() + YOUTUBE_MEDIA_CHANGE_COOLDOWN_MS;
    },
    bindYouTubeVideo(video) {
      const session = this.youtube;
      if (session.boundVideo === video) return;

      if (session.boundVideo && session.mediaBoundaryHandler) {
        for (const eventName of ['loadstart', 'loadedmetadata', 'emptied', 'durationchange', 'abort']) {
          session.boundVideo.removeEventListener(eventName, session.mediaBoundaryHandler);
        }
      }

      session.boundVideo = video;
      session.mediaBoundaryHandler = () => this.handleYouTubeMediaBoundary();

      if (video) {
        for (const eventName of ['loadstart', 'loadedmetadata', 'emptied', 'durationchange', 'abort']) {
          video.addEventListener(eventName, session.mediaBoundaryHandler, { passive: true });
        }
      }
    },
    bindYouTubePlayer(player) {
      const session = this.youtube;
      if (session.player === player) return;

      session.playerObserver?.disconnect();
      session.playerObserver = null;
      session.player = player;

      if (!player) return;
      session.playerObserver = new MutationObserver(() => {
        // MutationObserver callbacks run promptly when YouTube removes the
        // ad-showing class, minimizing any playback-rate spill into content.
        this.evaluateYouTubeAdPlayback();
      });
      session.playerObserver.observe(player, {
        attributes: true,
        attributeFilter: ['class'],
        childList: true,
        subtree: true
      });
    },
    evaluateYouTubeAdPlayback() {
      if (!this.enabled || !this.fastForwardYoutubeAds || !isYouTube()) {
        this.restoreYouTubePlayback();
        return;
      }

      const player = this.getYouTubePlayer();
      const video = this.getYouTubeVideo(player);
      this.bindYouTubePlayer(player);
      this.bindYouTubeVideo(video);

      if (!player || !video || Date.now() < this.youtube.cooldownUntil) {
        this.restoreYouTubePlayback();
        return;
      }

      if (!this.hasStrongYouTubeAdEvidence(player) || !this.isLikelyYouTubeAdMedia(video)) {
        this.restoreYouTubePlayback();
        return;
      }

      if (!this.youtube.active) {
        this.youtube.confirmationTicks += 1;
        if (this.youtube.confirmationTicks < YOUTUBE_AD_CONFIRM_TICKS) return;

        const currentRate = Number(video.playbackRate);
        const defaultRate = Number(video.defaultPlaybackRate);
        this.youtube.restoreRate = Number.isFinite(currentRate) && currentRate > 0 && currentRate <= 4
          ? currentRate
          : Number.isFinite(defaultRate) && defaultRate > 0
            ? defaultRate
            : 1;
        this.youtube.video = video;
        this.youtube.active = true;
        this.stats.acceleratedVideoAds += 1;
      }

      // Re-check immediately before touching playback. Never seek, mute,
      // change volume, call play(), or call pause().
      if (
        this.youtube.video !== video ||
        !this.hasStrongYouTubeAdEvidence(player) ||
        !this.isLikelyYouTubeAdMedia(video)
      ) {
        this.restoreYouTubePlayback();
        return;
      }

      try {
        if (video.playbackRate !== YOUTUBE_AD_RATE) video.playbackRate = YOUTUBE_AD_RATE;
      } catch {
        this.restoreYouTubePlayback();
      }
    },
    handleYouTubeAdControls() {
      if (!this.enabled || !isYouTube()) {
        this.restoreYouTubePlayback();
        return;
      }

      this.clickFirst(CLOSE_AD_SELECTORS);
      if (this.clickFirst(SKIP_SELECTORS)) {
        this.stats.skippedVideoAds += 1;
      }
      this.evaluateYouTubeAdPlayback();
    },
    installPatches() {
      if (this.patched) return;
      this.patched = true;

      if (typeof window.fetch === 'function') {
        this.originals.fetch = window.fetch;
        const shield = this;
        window.fetch = function (...args) {
          if (shield.isBlocked(args[0])) {
            shield.recordBlockedRequest();
            return Promise.reject(new TypeError('Blocked by Web 3 Browser Shields'));
          }
          return shield.originals.fetch.apply(this, args);
        };
      }

      if (window.XMLHttpRequest?.prototype?.open) {
        this.originals.xhrOpen = window.XMLHttpRequest.prototype.open;
        const shield = this;
        window.XMLHttpRequest.prototype.open = function (method, url, ...rest) {
          if (shield.isBlocked(url)) {
            shield.recordBlockedRequest();
            return shield.originals.xhrOpen.call(this, method, 'data:text/plain,', ...rest);
          }
          return shield.originals.xhrOpen.call(this, method, url, ...rest);
        };
      }

      if (typeof window.open === 'function') {
        this.originals.windowOpen = window.open;
        const shield = this;
        window.open = function (url, ...rest) {
          if (url && shield.isBlocked(url)) {
            shield.recordBlockedRequest();
            return null;
          }
          return shield.originals.windowOpen.call(this, url, ...rest);
        };
      }

      // Block ad-host resources created after document start before they connect.
      if (typeof Element !== 'undefined' && Element.prototype.setAttribute) {
        this.originals.setAttribute = Element.prototype.setAttribute;
        const shield = this;
        Element.prototype.setAttribute = function (name, value) {
          const lowerName = String(name).toLowerCase();
          if ((lowerName === 'src' || lowerName === 'href') && shield.isBlocked(value)) {
            shield.recordBlockedRequest();
            return shield.originals.setAttribute.call(this, name, 'data:text/plain,');
          }
          return shield.originals.setAttribute.call(this, name, value);
        };
      }
    },
    uninstallPatches() {
      if (!this.patched) return;
      if (this.originals.fetch) window.fetch = this.originals.fetch;
      if (this.originals.xhrOpen) window.XMLHttpRequest.prototype.open = this.originals.xhrOpen;
      if (this.originals.windowOpen) window.open = this.originals.windowOpen;
      if (this.originals.setAttribute) Element.prototype.setAttribute = this.originals.setAttribute;
      this.originals = {};
      this.patched = false;
    },
    ensureStyle() {
      if (this.style || !document.documentElement) return;
      this.style = document.createElement('style');
      this.style.id = 'web3-browser-shields-style';
      this.style.textContent = `${HIDE_SELECTORS.join(',')} { display: none !important; visibility: hidden !important; }`;
      (document.head || document.documentElement).appendChild(this.style);
    },
    startDomProtection() {
      if (!this.enabled || !document.documentElement) return;
      this.ensureStyle();

      this.observer?.disconnect();
      this.observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node instanceof Element) this.scan(node);
          }
        }
        if (isYouTube()) this.handleYouTubeAdControls();
      });
      this.observer.observe(document.documentElement, { childList: true, subtree: true });

      clearInterval(this.maintenanceTimer);
      this.maintenanceTimer = setInterval(() => {
        if (!this.enabled) return;
        this.scan(document);
        this.handleYouTubeAdControls();
      }, 100);

      this.scan(document);
      this.handleYouTubeAdControls();
    },
    start() {
      this.installPatches();

      if (!document.documentElement) {
        document.addEventListener('DOMContentLoaded', () => {
          if (this.enabled) this.startDomProtection();
        }, { once: true });
        return;
      }

      this.startDomProtection();
    },
    stop() {
      this.restoreYouTubePlayback();
      this.youtube.playerObserver?.disconnect();
      this.youtube.playerObserver = null;
      this.youtube.player = null;
      this.bindYouTubeVideo(null);
      this.observer?.disconnect();
      this.observer = null;
      clearInterval(this.maintenanceTimer);
      this.maintenanceTimer = null;
      this.style?.remove();
      this.style = null;
      this.restoreHiddenElements();
      this.uninstallPatches();
    },
    configure(nextEnabled, nextBlockTrackers, nextFastForwardYoutubeAds) {
      this.enabled = Boolean(nextEnabled);
      this.blockTrackers = Boolean(nextBlockTrackers);
      this.fastForwardYoutubeAds = Boolean(nextFastForwardYoutubeAds);
      if (this.enabled) this.start();
      else this.stop();
      if (!this.fastForwardYoutubeAds) this.restoreYouTubePlayback();
    }
  };

  try {
    Object.defineProperty(window, key, {
      value: state,
      configurable: true,
      enumerable: false,
      writable: false
    });
    Object.defineProperty(window, '__web3BrowserShieldStats', {
      get: () => ({ ...state.stats }),
      configurable: true,
      enumerable: false
    });
  } catch {
    window[key] = state;
  }

  state.configure(enabled, blockTrackers, fastForwardYoutubeAds);
})();
