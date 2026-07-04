const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const assets = path.join(dist, 'assets');
const failures = [];

const record = (name, fn) => {
  try {
    fn();
    console.log(`[distSmoke] ok ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`[distSmoke] fail ${name}: ${error.message}`);
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const exists = (file) => fs.existsSync(path.join(root, file));

const assetFiles = () => {
  assert(fs.existsSync(assets), 'dist/assets not found; run npm run build first');
  return fs.readdirSync(assets).sort();
};

const hasAsset = (files, pattern) => files.some((file) => pattern.test(file));

const packagedApeHelperCandidates = () => [
  path.join(root, 'build/mac-arm64/Coral Music.app/Contents/Resources/bin/coral-ape-helper'),
  path.join(root, 'build/mac/Coral Music.app/Contents/Resources/bin/coral-ape-helper'),
  path.join(root, 'build/win-unpacked/resources/bin/coral-ape-helper.exe'),
  path.join(root, 'build/linux-unpacked/resources/bin/coral-ape-helper'),
];

record('required dist entry files exist', () => {
  const required = [
    'dist/index.html',
    'dist/lyric.html',
    'dist/main.js',
    'dist/user-api-preload.js',
    'dist/dbService.worker.js',
  ];
  for (const file of required) {
    assert(exists(file), `${file} not found; run npm run build first`);
  }
});

record('renderer route chunks exist', () => {
  const files = assetFiles();
  const required = [
    /^SearchRoutePanel-.+\.js$/,
    /^SongListRoutePanel-.+\.js$/,
    /^LeaderboardRoutePanel-.+\.js$/,
    /^LocalListRoutePanel-.+\.js$/,
    /^DownloadRoutePanel-.+\.js$/,
    /^SettingsRoutePanel-.+\.js$/,
  ];
  for (const pattern of required) {
    assert(hasAsset(files, pattern), `missing route chunk ${pattern}`);
  }
});

record('renderer and lyric vendor chunks exist', () => {
  const files = assetFiles();
  const required = [
    /^sdk-.+\.js$/,
    /^vendor-antd-_util-.+\.js$/,
    /^vendor-state-.+\.js$/,
    /^lyric-vendor-antd-_util-.+\.js$/,
    /^lyric-vendor-state-.+\.js$/,
    /^lyric-font-player-.+\.js$/,
  ];
  for (const pattern of required) {
    assert(hasAsset(files, pattern), `missing vendor chunk ${pattern}`);
  }
});

record('webm demux wasm asset exists', () => {
  const wasmPath = path.join(assets, 'web-demuxer.wasm');
  assert(fs.existsSync(wasmPath), 'missing dist/assets/web-demuxer.wasm');
  const size = fs.statSync(wasmPath).size;
  assert(size > 1024 * 1024, `web-demuxer.wasm is unexpectedly small: ${size} bytes`);
});

record('browser chunks stay below warning threshold', () => {
  const maxBytes = 500 * 1024;
  const oversized = [];
  for (const file of assetFiles()) {
    if (!file.endsWith('.js')) continue;
    const size = fs.statSync(path.join(assets, file)).size;
    if (size > maxBytes) oversized.push(`${file}=${Math.round(size / 1024)}KiB`);
  }
  assert(oversized.length === 0, `oversized browser chunks: ${oversized.join(', ')}`);
});

record('preload and worker outputs stay bounded', () => {
  const limits = [
    ['dist/user-api-preload.js', 500 * 1024],
    ['dist/dbService.worker.js', 120 * 1024],
  ];
  for (const [file, maxBytes] of limits) {
    const size = fs.statSync(path.join(root, file)).size;
    assert(size <= maxBytes, `${file} is ${Math.round(size / 1024)}KiB`);
  }
});

record('packaged native ape helper is copied when dir package exists', () => {
  const buildDir = path.join(root, 'build');
  if (!fs.existsSync(buildDir)) return;
  const appDirs = ['build/mac-arm64', 'build/mac', 'build/win-unpacked', 'build/linux-unpacked'];
  const hasDirPackage = appDirs.some((dir) => fs.existsSync(path.join(root, dir)));
  if (!hasDirPackage) return;
  const helperPath = packagedApeHelperCandidates().find((candidate) => fs.existsSync(candidate));
  assert(helperPath, 'missing packaged native APE helper in Resources/bin');
  const size = fs.statSync(helperPath).size;
  assert(size > 64 * 1024, `packaged native APE helper is unexpectedly small: ${size} bytes`);
});

if (failures.length) {
  console.error(`\n[distSmoke] ${failures.length} check(s) failed`);
  process.exit(1);
}

console.log('\n[distSmoke] passed');
