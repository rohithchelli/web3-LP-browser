# v0.3.4 installation repair

The previous repair script could still report `@tailwindcss/postcss` as missing
for two reasons:

1. A user-level npm setting or `NODE_ENV=production` could omit all
   `devDependencies`. The clean install then added only runtime packages while
   leaving out Tailwind, PostCSS, TypeScript, and the Tauri CLI.
2. The integrity checker attempted to resolve `package/package.json`. Modern
   package export rules can reject that subpath even when the package is
   installed correctly.

v0.3.4 forces `--include=dev`, sets a project-level `include=dev`, checks package
manifests directly on disk, and separately verifies the public package entry
point. Browser tabs, navigation, Shields, and the guarded ad accelerator are
unchanged.
