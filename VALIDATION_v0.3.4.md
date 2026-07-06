# v0.3.4 validation

Validated after the installer-only changes:

- Dependency checker passes when a package exposes its public entry point but hides `./package.json`.
- The former `require.resolve("@tailwindcss/postcss/package.json")` method fails in that simulated exports-safe case, confirming the false-positive path is removed.
- Navigation checks passed.
- Native child-webview wiring checks passed.
- 35 Shields safety and wiring checks passed.
- 8 guarded ad-accelerator behavior checks passed.
- Project JSON files parsed successfully.
- No internal OpenAI npm-registry URLs remain.

The browser, Shields, and ad-accelerator source were unchanged from v0.3.3.
This release changes dependency installation and validation only.
