const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const failures = [];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const record = (name, fn) => {
  try {
    fn();
    console.log(`[playbackCapabilitySmoke] ok ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`[playbackCapabilitySmoke] fail ${name}: ${error.message}`);
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const assertIncludes = (content, needles, file) => {
  for (const needle of needles) {
    assert(content.includes(needle), `${file} missing ${needle}`);
  }
};

const assertNotIncludes = (content, needles, file) => {
  for (const needle of needles) {
    assert(!content.includes(needle), `${file} should not include ${needle}`);
  }
};

record('playback capability plan is documented', () => {
  const file = 'skills/coral-music-desktop/references/playback-capability-plan.md';
  assert(exists(file), `${file} not found`);
  assertIncludes(
    read(file),
    [
      'Foobar2000',
      'FLAC',
      'DSD',
      'SACD',
      'external decoder adapter',
      'Coral Music User API',
      'common.apiSource',
      'Step 132',
      'Step 133',
      'Step 134',
    ],
    file,
  );
});

record('playback capability constants are centralized', () => {
  const file = 'src/shared/playbackCapabilities.ts';
  assertIncludes(
    read(file),
    [
      'nativeLocalAudioExtensions',
      'internalAudioDecodeExtensions',
      'externalDecoderExtensions',
      'externalDecoderExtensionAliases',
      'playbackCapabilityRoadmap',
      'normalizeAudioExtension',
      'isNativeLocalAudioExtension',
      'isExternalDecoderExtension',
      'sadc',
    ],
    file,
  );
});

record('app setting schema exposes local audio and decoder settings', () => {
  const file = 'src/common/types/app_setting.d.ts';
  assertIncludes(
    read(file),
    [
      "'player.localAudio.enabled': boolean",
      "'player.localAudio.scanDirs': string[]",
      "'player.localAudio.supportedExts': string[]",
      "'player.externalDecoder.enabled': boolean",
      "'player.externalDecoder.preferredOutput': 'wav' | 'pcm'",
      "'player.externalDecoder.extensions': string[]",
      "'player.externalDecoder.timeoutMs': number",
      "'player.sourcePlugin.allowUserApi': boolean",
      "'player.sourcePlugin.preferUserApi': boolean",
    ],
    file,
  );
});

record('default settings are conservative', () => {
  const file = 'src/common/defaultSetting.ts';
  assertIncludes(
    read(file),
    [
      "'player.localAudio.enabled': true",
      "'player.localAudio.scanDirs': []",
      "'player.localAudio.supportedExts': [",
      "'qoa'",
      "'aiff'",
      "'caf'",
      "'webm'",
      "'amr'",
      "'wma'",
      "'player.externalDecoder.enabled': true",
      "'player.externalDecoder.preferredOutput': 'wav'",
      "'player.externalDecoder.extensions': ['dsf', 'dff', 'alac', 'ac3', 'ape']",
      "'player.externalDecoder.timeoutMs': 30_000",
      "'player.sourcePlugin.allowUserApi': true",
      "'player.sourcePlugin.preferUserApi': true",
    ],
    file,
  );
});

record('current runtime keeps local url and user api boundaries visible', () => {
  assertIncludes(
    read('src/renderer-react/services/playerRuntime/musicUrlResolver.ts'),
    [
      'resolveLocalMusicUrl',
      "musicInfo.source !== 'local'",
      'fetchFreshOnlineMusicUrl',
      'loadMusicSdk()',
    ],
    'src/renderer-react/services/playerRuntime/musicUrlResolver.ts',
  );
  assertIncludes(
    read('src/renderer-react/services/userApiService.ts'),
    ['importUserApi', 'setUserApi'],
    'src/renderer-react/services/userApiService.ts',
  );
  assertIncludes(
    read('src/renderer-react/stores/domains/userApiStore.ts'),
    ['importUserApi', 'setUserApi'],
    'src/renderer-react/stores/domains/userApiStore.ts',
  );
});

record('local audio import is wired to list runtime', () => {
  assertIncludes(
    read('src/renderer-react/services/localAudioService.ts'),
    [
      'createLocalMusicInfo',
      'createLocalMusicInfoWithMetadata',
      'createLocalMusicInfosFromPaths',
      'readLocalAudioMetadata',
      'readLocalAudioHeaderInfo',
      'parseFile(filePath, { duration: true })',
      'parseAudioHeader',
      'formatDuration',
      "source: 'local'",
      'readDirectory',
      'isLocalAudioDecoderCandidate',
      'picUrl: pictureUrl ?? musicInfo.meta.picUrl',
      'sampleRate: sampleRate ?? musicInfo.meta.sampleRate',
      'bitrate: bitrate ?? musicInfo.meta.bitrate',
    ],
    'src/renderer-react/services/localAudioService.ts',
  );
  assertIncludes(
    read('src/renderer-react/stores/domains/listStore.ts'),
    [
      'LOCAL_AUDIO_LIST_NAME',
      'ensureLocalAudioList',
      'isImportingLocalAudio',
      'importLocalAudioPaths',
      'importLocalAudioPathsToLocalList',
      'updateSelectedMusicInfo',
      'localAudioService.createLocalMusicInfosFromPaths',
      'listService.addListMusics',
      'listService.updateListMusics',
    ],
    'src/renderer-react/stores/domains/listStore.ts',
  );
  assertIncludes(
    read('src/renderer-react/services/listService.ts'),
    ['updateListMusics', 'ipcChannels.player.listMusicUpdate'],
    'src/renderer-react/services/listService.ts',
  );
  assertIncludes(
    read('src/renderer-react/features/list/LocalListRoutePanel.tsx'),
    [
      'handleImportLocalAudio',
      "{ extensions: ['*'], name: 'All Files' }",
      'openDirectory',
      'player.localAudio.supportedExts',
      'const externalExtensions = externalDecoderExtensions',
      'importLocalAudioPathsToLocalList',
      '本地音频',
    ],
    'src/renderer-react/features/list/LocalListRoutePanel.tsx',
  );
});

record('drag and drop imports local audio into the local music list', () => {
  assertIncludes(
    read('src/renderer-react/app/AppShell.tsx'),
    [
      'getDroppedFilePaths',
      'handleFileDrop',
      'onDragOver={handleFileDragOver}',
      'onDrop={handleFileDrop}',
      'importLocalAudioPathsToLocalList',
      'const externalExtensions = externalDecoderExtensions',
      '松开导入到本地音乐',
    ],
    'src/renderer-react/app/AppShell.tsx',
  );
  assertIncludes(
    read('src/renderer-react/styles/index.css'),
    ['coral-file-drop-overlay', 'coral-file-drop-panel'],
    'src/renderer-react/styles/index.css',
  );
});

record('external decoder probe is typed and non-executing', () => {
  assertIncludes(
    read('src/shared/playbackCapabilities.ts'),
    [
      'ExternalDecoderProbeParams',
      'ExternalDecoderProbeResult',
      'ExternalDecoderTranscodeParams',
      'ExternalDecoderTranscodeResult',
    ],
    'src/shared/playbackCapabilities.ts',
  );
  assertIncludes(
    read('src/common/ipcNames.ts'),
    ['external_decoder_probe', 'external_decoder_transcode'],
    'src/common/ipcNames.ts',
  );
  assertIncludes(
    read('src/shared/ipc/contracts.ts'),
    [
      'externalDecoderProbe',
      'externalDecoderTranscode',
      'ExternalDecoderProbeParams',
      'ExternalDecoderProbeResult',
      'ExternalDecoderTranscodeParams',
      'ExternalDecoderTranscodeResult',
    ],
    'src/shared/ipc/contracts.ts',
  );
  assertIncludes(
    read('src/main/modules/winMain/externalDecoderProbe.ts'),
    ['probeExternalDecoder', "require('ffmpeg-static')", 'canProbe', 'executableExists'],
    'src/main/modules/winMain/externalDecoderProbe.ts',
  );
  assertIncludes(
    read('src/main/modules/winMain/externalDecoderRuntime.ts'),
    [
      'transcodeExternalDecoder',
      "require('ffmpeg-static')",
      'resolveBundledFfmpegPath',
      'runFfmpeg',
      'spawn(',
      "'-i'",
      "'pcm_s16le'",
      'coral-decoder',
      '内嵌 FFmpeg',
      '内嵌 FFmpeg 解码超时',
    ],
    'src/main/modules/winMain/externalDecoderRuntime.ts',
  );
  assertIncludes(
    read('src/main/modules/winMain/rendererEvent/app.ts'),
    [
      'external_decoder_probe',
      'external_decoder_transcode',
      'probeExternalDecoder(params)',
      'transcodeExternalDecoder(params)',
    ],
    'src/main/modules/winMain/rendererEvent/app.ts',
  );
  assertIncludes(
    read('src/renderer-react/services/externalDecoderService.ts'),
    [
      'probeExternalDecoder',
      'transcodeExternalDecoder',
      'externalDecoderProbe',
      'externalDecoderTranscode',
      'Electron IPC is unavailable.',
    ],
    'src/renderer-react/services/externalDecoderService.ts',
  );
});

record('local playback resolver unifies local files through audio-decode', () => {
  const file = 'src/renderer-react/services/playerRuntime/musicUrlResolver.ts';
  assertIncludes(
    read(file),
    [
      'isExternalDecoderExtension',
      'resolveExternalDecodedLocalMusicUrl',
      'canDecodeLocalAudioExtension',
      'resolveInternalDecodedPath',
      'return null;',
      'if (internalDecoded) return internalDecoded',
      'decodedFilePath',
      'objectUrl',
      'externalDecoderService.transcodeExternalDecoder',
      "output: 'wav'",
      "decodeLocalAudioToObjectUrl(result.outputPath, 'wav')",
    ],
    file,
  );
  assertNotIncludes(
    read(file),
    [
      "setting?.['player.externalDecoder.enabled']",
      "setting['player.externalDecoder.extensions']",
      '请在“设置 > 本地解码”启用 FFmpeg',
      '请在“设置 > 本地解码”加入该扩展',
    ],
    file,
  );
  assertIncludes(
    read('src/renderer-react/services/playerRuntime/htmlAudioRuntime.ts'),
    [
      'currentDecodedFilePath',
      'currentObjectUrl',
      'decodedAudioBuffer',
      'AudioBufferSourceNode',
      'createAudioBuffer',
      'playDecodedAudio',
      'copyToChannel',
      'clearDecodedFile',
      'clearObjectUrl',
      'removeFile(resolved.decodedFilePath)',
      'revokeObjectURL',
      'this.clearDecodedFile(resolved.decodedFilePath)',
    ],
    'src/renderer-react/services/playerRuntime/htmlAudioRuntime.ts',
  );
  assertIncludes(
    read('src/renderer-react/services/playerRuntime/localAudioDecodeService.ts'),
    [
      'decodeLocalAudio',
      'decodeLocalAudioToObjectUrl',
      'decodeWavFileInMain',
      'internalAudioDecodeExtensions',
      'URL.createObjectURL',
    ],
    'src/renderer-react/services/playerRuntime/localAudioDecodeService.ts',
  );
  assertIncludes(
    read('src/renderer-react/stores/domains/playerStore.ts'),
    [
      'enrichCurrentLocalMusicInfo',
      'probeSampleRate',
      'probeBitrate',
      'updateSelectedMusicInfo(enrichedMusicInfo)',
    ],
    'src/renderer-react/stores/domains/playerStore.ts',
  );
  assertIncludes(
    read('src/renderer-react/stores/domains/playerStore.ts'),
    ['errorText', 'needsSourcePlugin'],
    'src/renderer-react/stores/domains/playerStore.ts',
  );
  assertNotIncludes(
    read('src/renderer-react/components/player/PlayBar.tsx'),
    ['player.needsExternalDecoder', '配置解码器'],
    'src/renderer-react/components/player/PlayBar.tsx',
  );
  assertNotIncludes(
    read('src/renderer-react/components/player/PlayDetailOverlay.tsx'),
    ['player.needsExternalDecoder', '配置解码器'],
    'src/renderer-react/components/player/PlayDetailOverlay.tsx',
  );
});

record('user api playback selection validates musicUrl capability', () => {
  assertIncludes(
    read('src/renderer-react/stores/domains/userApiStore.ts'),
    [
      'getPlayableUserApiSources',
      'getPlayableUserApiSourceNames',
      'canPlayWithUserApi',
      'playableUserApis',
    ],
    'src/renderer-react/stores/domains/userApiStore.ts',
  );
  assertIncludes(
    read('src/renderer-react/features/settings/SettingsRoutePanel.tsx'),
    [
      'userApi.canPlay(runtimeApiInfo)',
      '该 User API 没有声明任何平台的 musicUrl 能力',
      '可播放',
      '不可播放',
      'userApi.playableUserApis',
    ],
    'src/renderer-react/features/settings/SettingsRoutePanel.tsx',
  );
});

record('feature entrypoints remain visible for local files and source plugins', () => {
  assertIncludes(
    read('src/renderer-react/app/AppShell.tsx'),
    ['本地文件', '添加音源', 'importLocalAudio', 'importUserApiFile', 'importUserApiOnline'],
    'src/renderer-react/app/AppShell.tsx',
  );
  assertIncludes(
    read('src/renderer-react/features/settings/SettingsRoutePanel.tsx'),
    ['内嵌 FFmpeg', '用户无需配置'],
    'src/renderer-react/features/settings/SettingsRoutePanel.tsx',
  );
  assertNotIncludes(
    read('src/renderer-react/features/settings/SettingsRoutePanel.tsx'),
    [
      'label="外部解码器"',
      "'player.externalDecoder.enabled'",
      "'player.externalDecoder.preferredOutput'",
      "'player.externalDecoder.timeoutMs'",
      "'player.externalDecoder.extensions'",
      'handleProbeExternalDecoder',
      'decoderProbeResult',
      'isProbingDecoder',
    ],
    'src/renderer-react/features/settings/SettingsRoutePanel.tsx',
  );
  assertIncludes(
    read('build-config/build-pack.js'),
    ['node_modules/ffmpeg-static'],
    'build-config/build-pack.js',
  );
  assertIncludes(
    read('src/renderer-react/stores/domains/uiStore.ts'),
    ['UiQuickAction', 'configureExternalDecoder', 'requestQuickAction', 'consumeQuickAction'],
    'src/renderer-react/stores/domains/uiStore.ts',
  );
  assertIncludes(
    read('src/renderer-react/features/settings/SettingsRoutePanel.tsx'),
    [
      'externalDecoderSectionRef',
      "ui.consumeQuickAction('configureExternalDecoder')",
      'scrollIntoView',
    ],
    'src/renderer-react/features/settings/SettingsRoutePanel.tsx',
  );
  assertIncludes(
    read('src/renderer-react/features/list/LocalListRoutePanel.tsx'),
    [
      '本地音频导入已关闭',
      'configureExternalDecoder',
      'handleCreateLocalList',
      '当前列表暂无歌曲',
      '导入本地音频',
      'importLocalAudioPathsToLocalList',
    ],
    'src/renderer-react/features/list/LocalListRoutePanel.tsx',
  );
});

record('release smoke includes playback capability guard', () => {
  const pkg = JSON.parse(read('package.json'));
  assert(pkg.scripts['smoke:playback-capabilities'], 'missing smoke:playback-capabilities');
  assert(
    pkg.scripts['smoke:release'].includes('smoke:playback-capabilities'),
    'smoke:release should include playback capability smoke',
  );
});

if (failures.length) {
  console.error(`\n[playbackCapabilitySmoke] ${failures.length} check(s) failed`);
  process.exit(1);
}

console.log('\n[playbackCapabilitySmoke] passed');
