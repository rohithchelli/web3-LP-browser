# Web 3 Browser — Shields v0.3.4 Ad Accelerator

Native Tauri/WebView2 multi-tab browser with advertising and tracker protection plus a guarded YouTube video-ad accelerator.

## What v0.3.4 changes

v0.3.0 was too aggressive because it sought the shared YouTube media element to the end. v0.3.1 removed all playback changes, which protected normal videos but left unskippable ads playing. v0.3.4 uses a narrower middle ground:

- It clicks only YouTube-specific **Skip Ad** and **Close Ad** controls.
- For an unskippable video ad, it raises playback speed to 8× only after multiple ad checks pass.
- It never changes `currentTime`, mute, volume, play or pause.
- It restores the user's previous playback speed immediately when the ad state disappears or the media source changes.

## Safety conditions

Acceleration starts only when all of these are true:

1. The page is YouTube.
2. YouTube's `#movie_player` has the `ad-showing` state.
3. A visible ad-only badge, countdown, message or control is present.
4. The media duration is finite, positive and no longer than 180 seconds.
5. The condition is confirmed twice.
6. No media/source transition occurred during the preceding one-second safety window.

If any condition becomes false, the original playback speed is restored immediately. Long or uncertain media is not accelerated.

## Run on Windows

1. Close every running copy of Web 3 Browser.
2. Extract this ZIP into a new short folder, for example `C:\Web3Browser034`.
3. Run `CHECK-SETUP.bat`.
4. Run `START-BROWSER.bat`.
5. Allow the Rust build to finish.
6. Open YouTube in a new tab or reload it once.

`RUN-WEB.bat` and `RUN-WEB-PREVIEW.bat` are interface previews only. Use `START-BROWSER.bat` for real browsing.

## Settings

Open **Settings → Privacy & shields**.

- **Browser shields:** master request and cosmetic filtering switch.
- **Fast-forward YouTube video ads:** guarded 8× acceleration for short, verified video ads. Disable this independently if YouTube changes its player.
- **Block trackers:** stricter analytics filtering. Disable this first if a login-heavy website misbehaves.

## Installation self-repair

The v0.3.2 dependency integrity checks remain included. The launcher verifies critical npm modules before every start, repairs incomplete installations and clears stale Next.js development cache files. `FIX-MISSING-MODULE.bat` handles the earlier `@alloc/quick-lru` error.

## Limitation

YouTube frequently changes its player and can deliver ads through the same origin and media pipeline as requested content. This build is designed to fail safely: when ad identity is uncertain, it leaves playback alone rather than risk accelerating the requested video.
