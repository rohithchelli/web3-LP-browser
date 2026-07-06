# Project Review — Web 3 Browser Shields v0.3.4

## Scope

This release changes only the Shields configuration and injected ad-handling script. The working Tauri child-WebView tab architecture, navigation, history and launcher flow are preserved.

## Root problem

The aggressive v0.3.0 implementation used timeline seeking on YouTube's shared video element. YouTube can reuse that element while moving from an ad to requested content, so seeking could affect the real video. The v0.3.1 safety hotfix removed media manipulation entirely, which also removed the ability to shorten unskippable ads.

## Current design

v0.3.4 uses a guarded state machine. It accelerates only short media after the YouTube player state and visible ad UI agree twice. It observes player and media transitions, restores the previous rate immediately and pauses acceleration decisions for one second whenever the media boundary changes.

## Risk assessment

- **Normal-video seeking risk:** removed; no `currentTime` writes exist.
- **Normal-video acceleration risk:** substantially reduced through multiple independent checks, duration cap, transition listeners and immediate restoration.
- **Website compatibility risk:** isolated behind a separate setting.
- **Future YouTube markup changes:** possible; the feature should fail closed and leave uncertain playback unchanged.

## Honest status

The source and wiring checks pass in the packaging environment. A real YouTube ad campaign cannot be deterministically reproduced here, and the final Windows WebView2/Rust compilation occurs on the user's Windows machine. Runtime behavior must therefore be confirmed against the current YouTube player after launch.
