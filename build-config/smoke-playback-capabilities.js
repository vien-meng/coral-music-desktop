const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const failures = []

const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const exists = file => fs.existsSync(path.join(root, file))

const record = (name, fn) => {
  try {
    fn()
    console.log(`[playbackCapabilitySmoke] ok ${name}`)
  } catch (error) {
    failures.push(`${name}: ${error.message}`)
    console.error(`[playbackCapabilitySmoke] fail ${name}: ${error.message}`)
  }
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const assertIncludes = (content, needles, file) => {
  for (const needle of needles) {
    assert(content.includes(needle), `${file} missing ${needle}`)
  }
}

record('playback capability plan is documented', () => {
  const file = 'skills/coral-music-desktop/references/playback-capability-plan.md'
  assert(exists(file), `${file} not found`)
  assertIncludes(read(file), [
    'Foobar2000',
    'FLAC',
    'DSD',
    'SACD',
    'external decoder adapter',
    'LX Music User API',
    'common.apiSource',
    'Step 132',
    'Step 133',
    'Step 134',
  ], file)
})

record('playback capability constants are centralized', () => {
  const file = 'src/shared/playbackCapabilities.ts'
  assertIncludes(read(file), [
    'nativeLocalAudioExtensions',
    'externalDecoderExtensions',
    'externalDecoderExtensionAliases',
    'foobar2000DecoderPluginHints',
    'playbackCapabilityRoadmap',
    'normalizeAudioExtension',
    'isNativeLocalAudioExtension',
    'isExternalDecoderExtension',
    'foo_input_sacd',
    'sadc',
  ], file)
})

record('app setting schema exposes local audio and decoder settings', () => {
  const file = 'src/common/types/app_setting.d.ts'
  assertIncludes(read(file), [
    "'player.localAudio.enabled': boolean",
    "'player.localAudio.scanDirs': string[]",
    "'player.localAudio.supportedExts': string[]",
    "'player.externalDecoder.enabled': boolean",
    "'player.externalDecoder.provider': 'none' | 'foobar2000'",
    "'player.externalDecoder.executablePath': string",
    "'player.externalDecoder.pluginDirs': string[]",
    "'player.externalDecoder.preferredOutput': 'wav' | 'pcm'",
    "'player.externalDecoder.extensions': string[]",
    "'player.externalDecoder.timeoutMs': number",
    "'player.sourcePlugin.allowUserApi': boolean",
    "'player.sourcePlugin.preferUserApi': boolean",
  ], file)
})

record('default settings are conservative', () => {
  const file = 'src/common/defaultSetting.ts'
  assertIncludes(read(file), [
    "'player.localAudio.enabled': true",
    "'player.localAudio.scanDirs': []",
    "'player.localAudio.supportedExts': ['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg', 'opus']",
    "'player.externalDecoder.enabled': false",
    "'player.externalDecoder.provider': 'none'",
    "'player.externalDecoder.executablePath': ''",
    "'player.externalDecoder.pluginDirs': []",
    "'player.externalDecoder.preferredOutput': 'wav'",
    "'player.externalDecoder.extensions': ['dsf', 'dff', 'iso', 'sacd']",
    "'player.externalDecoder.timeoutMs': 30_000",
    "'player.sourcePlugin.allowUserApi': true",
    "'player.sourcePlugin.preferUserApi': true",
  ], file)
})

record('current runtime keeps local url and user api boundaries visible', () => {
  assertIncludes(read('src/renderer-react/services/playerRuntime/musicUrlResolver.ts'), [
    'resolveLocalMusicUrl',
    "musicInfo.source !== 'local'",
    'fetchFreshOnlineMusicUrl',
    'loadMusicSdk()',
  ], 'src/renderer-react/services/playerRuntime/musicUrlResolver.ts')
  assertIncludes(read('src/renderer-react/services/userApiService.ts'), [
    'importUserApi',
    'setUserApi',
  ], 'src/renderer-react/services/userApiService.ts')
  assertIncludes(read('src/renderer-react/stores/domains/userApiStore.ts'), [
    'importUserApi',
    'setUserApi',
  ], 'src/renderer-react/stores/domains/userApiStore.ts')
})

record('local audio import is wired to list runtime', () => {
  assertIncludes(read('src/renderer-react/services/localAudioService.ts'), [
    'createLocalMusicInfo',
    'createLocalMusicInfoWithMetadata',
    'createLocalMusicInfosFromPaths',
    'readLocalAudioMetadata',
    'parseFile(filePath, { duration: true })',
    'formatDuration',
    'source: \'local\'',
    'readDirectory',
    'isLocalAudioDecoderCandidate',
  ], 'src/renderer-react/services/localAudioService.ts')
  assertIncludes(read('src/renderer-react/stores/domains/listStore.ts'), [
    'isImportingLocalAudio',
    'importLocalAudioPaths',
    'localAudioService.createLocalMusicInfosFromPaths',
    'listService.addListMusics',
  ], 'src/renderer-react/stores/domains/listStore.ts')
  assertIncludes(read('src/renderer-react/features/list/LocalListRoutePanel.tsx'), [
    'handleImportLocalAudio',
    'openDirectory',
    'player.localAudio.supportedExts',
    'player.externalDecoder.extensions',
    '本地音频',
  ], 'src/renderer-react/features/list/LocalListRoutePanel.tsx')
})

record('external decoder probe is typed and non-executing', () => {
  assertIncludes(read('src/shared/playbackCapabilities.ts'), [
    'ExternalDecoderProbeParams',
    'ExternalDecoderProbeResult',
    'ExternalDecoderProbePathStatus',
  ], 'src/shared/playbackCapabilities.ts')
  assertIncludes(read('src/common/ipcNames.ts'), [
    'external_decoder_probe',
  ], 'src/common/ipcNames.ts')
  assertIncludes(read('src/shared/ipc/contracts.ts'), [
    'externalDecoderProbe',
    'ExternalDecoderProbeParams',
    'ExternalDecoderProbeResult',
  ], 'src/shared/ipc/contracts.ts')
  assertIncludes(read('src/main/modules/winMain/externalDecoderProbe.ts'), [
    'probeExternalDecoder',
    'fs.stat',
    'Foobar2000 executable path is empty.',
    'Foobar2000 component probing is Windows-focused',
    'canProbe',
  ], 'src/main/modules/winMain/externalDecoderProbe.ts')
  assertIncludes(read('src/main/modules/winMain/rendererEvent/app.ts'), [
    'external_decoder_probe',
    'probeExternalDecoder(params)',
  ], 'src/main/modules/winMain/rendererEvent/app.ts')
  assertIncludes(read('src/renderer-react/services/externalDecoderService.ts'), [
    'probeExternalDecoder',
    'externalDecoderProbe',
    'Electron IPC is unavailable.',
  ], 'src/renderer-react/services/externalDecoderService.ts')
})

record('release smoke includes playback capability guard', () => {
  const pkg = JSON.parse(read('package.json'))
  assert(pkg.scripts['smoke:playback-capabilities'], 'missing smoke:playback-capabilities')
  assert(pkg.scripts['smoke:release'].includes('smoke:playback-capabilities'), 'smoke:release should include playback capability smoke')
})

if (failures.length) {
  console.error(`\n[playbackCapabilitySmoke] ${failures.length} check(s) failed`)
  process.exit(1)
}

console.log('\n[playbackCapabilitySmoke] passed')
