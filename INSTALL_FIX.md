# Dependency self-repair retained in v0.3.4

The v0.3.2 installation repair remains active. `START-BROWSER.bat` checks required npm modules before launch, calls `INSTALL-DEPENDENCIES.bat` when the install is incomplete and clears stale Next.js development cache files.

For the earlier `Cannot find module '@alloc/quick-lru'` error, run `FIX-MISSING-MODULE.bat` from the project folder. Do not run npm commands from `C:\Users\RC`; first enter the folder with `cd /d "FULL_PROJECT_PATH"`.
