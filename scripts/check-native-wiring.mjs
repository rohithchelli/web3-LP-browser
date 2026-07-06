import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))

const failures = []
const expect = (condition, message) => {
  if (!condition) failures.push(message)
}

const tauriConfig = json('src-tauri/tauri.conf.json')
const capability = json('src-tauri/capabilities/default.json')
const packageJson = json('package.json')
const cargo = read('src-tauri/Cargo.toml')
const rust = read('src-tauri/src/lib.rs')
const webview = read('components/browser/webview.tsx')

expect(tauriConfig.app?.windows?.[0]?.label === 'main', 'Main Tauri window must be labelled "main".')
expect(tauriConfig.build?.frontendDist === '../out', 'Tauri frontendDist must point to ../out.')
expect(packageJson.dependencies?.['@tauri-apps/api'], '@tauri-apps/api dependency is missing.')
expect(cargo.includes('"unstable"'), 'Tauri unstable feature is required for independent child WebView lookup.')
expect(capability.permissions?.includes('core:webview:allow-create-webview'), 'Child WebView creation permission is missing.')
expect(capability.permissions?.includes('core:webview:allow-webview-show'), 'Child WebView show permission is missing.')
expect(capability.permissions?.includes('core:webview:allow-webview-hide'), 'Child WebView hide permission is missing.')
expect(capability.permissions?.includes('core:webview:allow-webview-close'), 'Child WebView close permission is missing.')
expect(webview.includes("invoke('browser_create_webview'"), 'React-to-Rust child WebView creation bridge is missing.')
expect(rust.includes('fn browser_create_webview'), 'Rust browser_create_webview command is missing.')
expect(rust.includes('.initialization_script('), 'Rust document-start initialization script is missing.')
expect(webview.includes("invoke('browser_navigate'"), 'React-to-Rust native navigation bridge is missing.')
expect(rust.includes('fn browser_navigate'), 'Rust browser_navigate command is missing.')
expect(rust.includes('fn browser_reload'), 'Rust browser_reload command is missing.')
expect(rust.includes('fn browser_back'), 'Rust browser_back command is missing.')
expect(rust.includes('fn browser_forward'), 'Rust browser_forward command is missing.')
expect(rust.includes('.on_page_load('), 'Rust page-load event bridge is missing.')
expect(fs.existsSync(path.join(root, 'START-BROWSER.bat')), 'START-BROWSER.bat is missing.')

if (failures.length) {
  console.error('Native browser wiring check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Native browser wiring check passed.')
