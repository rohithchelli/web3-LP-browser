# Validation — dependency self-repair retained in v0.3.4

- `@alloc/quick-lru` remains pinned in `devDependencies` and the public-registry lockfile.
- Startup checks critical dependency resolution before launching Tauri.
- Repair installs operate in place instead of requiring deletion of a Windows-locked `node_modules` tree.
- Stale `.next` development cache is removed before launch when present.
