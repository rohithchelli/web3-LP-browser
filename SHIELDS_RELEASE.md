# Web 3 Browser Shields v0.3.4 — Guarded YouTube Ad Accelerator

## Goal

Fast-forward verified YouTube video ads without repeating the v0.3.0 bug that could skip the requested video.

## Implementation

- Added a separate **Fast-forward YouTube video ads** setting, enabled by default.
- Uses 8× `playbackRate`; it never seeks the timeline.
- Requires YouTube's `ad-showing` class and visible ad-only UI at the same time.
- Requires two consecutive positive checks before acceleration.
- Limits acceleration to finite media of 180 seconds or less.
- Observes player class changes with `MutationObserver` for prompt restoration.
- Restores the saved user playback rate at every ad exit.
- Treats `loadstart`, `loadedmetadata`, `emptied`, `durationchange` and `abort` as media boundaries.
- Enforces a one-second cooldown after media boundaries before any new acceleration.
- Keeps specific Skip Ad and Close Ad button handling.
- Keeps sponsored-card, masthead, companion-ad and third-party ad/tracker filtering.

## Explicitly prohibited operations

The shield code does not:

- Set `video.currentTime`
- Mute or change volume
- Call `video.play()` or `video.pause()`
- Click broad non-ad “Skip” buttons
- Accelerate long or indeterminate media

## Preserved

Tabs, native child WebViews, navigation, search, history, private tabs, settings persistence, public npm registry configuration and Windows dependency self-repair remain unchanged.

## Compatibility fallback

Turn off only **Fast-forward YouTube video ads** to retain normal Shields filtering without any media-speed changes.
