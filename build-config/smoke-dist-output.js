const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')
const assets = path.join(dist, 'assets')
const failures = []

const record = (name, fn) => {
  try {
    fn()
    console.log(`[distSmoke] ok ${name}`)
  } catch (error) {
    failures.push(`${name}: ${error.message}`)
    console.error(`[distSmoke] fail ${name}: ${error.message}`)
  }
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const exists = file => fs.existsSync(path.join(root, file))

const assetFiles = () => {
  assert(fs.existsSync(assets), 'dist/assets not found; run npm run build first')
  return fs.readdirSync(assets).sort()
}

const hasAsset = (files, pattern) => files.some(file => pattern.test(file))

record('required dist entry files exist', () => {
  const required = [
    'dist/index.html',
    'dist/lyric.html',
    'dist/main.js',
    'dist/user-api-preload.js',
    'dist/dbService.worker.js',
  ]
  for (const file of required) {
    assert(exists(file), `${file} not found; run npm run build first`)
  }
})

record('renderer route chunks exist', () => {
  const files = assetFiles()
  const required = [
    /^SearchRoutePanel-.+\.js$/,
    /^SongListRoutePanel-.+\.js$/,
    /^LeaderboardRoutePanel-.+\.js$/,
    /^LocalListRoutePanel-.+\.js$/,
    /^DownloadRoutePanel-.+\.js$/,
    /^SettingsRoutePanel-.+\.js$/,
  ]
  for (const pattern of required) {
    assert(hasAsset(files, pattern), `missing route chunk ${pattern}`)
  }
})

record('renderer and lyric vendor chunks exist', () => {
  const files = assetFiles()
  const required = [
    /^sdk-.+\.js$/,
    /^vendor-antd-_util-.+\.js$/,
    /^vendor-state-.+\.js$/,
    /^lyric-vendor-antd-_util-.+\.js$/,
    /^lyric-vendor-state-.+\.js$/,
    /^lyric-font-player-.+\.js$/,
  ]
  for (const pattern of required) {
    assert(hasAsset(files, pattern), `missing vendor chunk ${pattern}`)
  }
})

record('browser chunks stay below warning threshold', () => {
  const maxBytes = 500 * 1024
  const oversized = []
  for (const file of assetFiles()) {
    if (!file.endsWith('.js')) continue
    const size = fs.statSync(path.join(assets, file)).size
    if (size > maxBytes) oversized.push(`${file}=${Math.round(size / 1024)}KiB`)
  }
  assert(oversized.length === 0, `oversized browser chunks: ${oversized.join(', ')}`)
})

record('preload and worker outputs stay bounded', () => {
  const limits = [
    ['dist/user-api-preload.js', 500 * 1024],
    ['dist/dbService.worker.js', 120 * 1024],
  ]
  for (const [file, maxBytes] of limits) {
    const size = fs.statSync(path.join(root, file)).size
    assert(size <= maxBytes, `${file} is ${Math.round(size / 1024)}KiB`)
  }
})

if (failures.length) {
  console.error(`\n[distSmoke] ${failures.length} check(s) failed`)
  process.exit(1)
}

console.log('\n[distSmoke] passed')
