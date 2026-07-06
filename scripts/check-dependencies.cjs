const fs = require('fs');
const path = require('path');

const quiet = process.argv.includes('--quiet');
const root = path.resolve(__dirname, '..');
const nodeModules = path.join(root, 'node_modules');
const requiredPackages = [
  'next',
  'react',
  'react-dom',
  '@tailwindcss/postcss',
  '@alloc/quick-lru',
  '@tauri-apps/api',
  '@tauri-apps/cli',
  'tailwindcss',
  'postcss',
  'typescript',
];

function manifestPath(packageName) {
  return path.join(nodeModules, ...packageName.split('/'), 'package.json');
}

function readManifest(packageName) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath(packageName), 'utf8'));
    if (manifest.name !== packageName || !manifest.version) return null;
    return manifest;
  } catch {
    return null;
  }
}

const missing = requiredPackages.filter((name) => !readManifest(name));
if (missing.length > 0) {
  if (!quiet) {
    console.error('Missing or incomplete dependencies:');
    for (const name of missing) console.error(`  - ${name}`);
    console.error('Run INSTALL-DEPENDENCIES.bat to repair the installation.');
  }
  process.exit(1);
}

// Verify the package entry point, not "package/package.json". Modern packages
// can hide package.json through the exports field even when correctly installed.
for (const request of ['next', 'react', 'react-dom', '@tailwindcss/postcss', '@alloc/quick-lru']) {
  try {
    require.resolve(request, { paths: [root] });
  } catch {
    if (!quiet) {
      console.error(`Installed package cannot be resolved: ${request}`);
      console.error('Run INSTALL-DEPENDENCIES.bat to repair the installation.');
    }
    process.exit(1);
  }
}

const marker = path.join(nodeModules, '.web3-install-complete');
if (!fs.existsSync(marker)) {
  if (!quiet) console.error('Dependency marker is missing. A repair install is required.');
  process.exit(1);
}

if (!quiet) console.log('Dependency integrity check passed.');
