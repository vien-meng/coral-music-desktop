const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const failures = [];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const loadTsModule = (file) => {
  const absolutePath = path.join(root, file);
  const source = fs.readFileSync(absolutePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: absolutePath,
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(transpiled, {
    exports: module.exports,
    module,
    require,
  });
  return module.exports;
};

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
      'APE playback uses the native helper first',
      'Windows helper build, signing, and real APE album samples still need verification',
    ],
    file,
  );
  assertNotIncludes(
    read(file),
    [
      'current APE playback continues to use FFmpeg',
      'keeps it disabled until it is packaged',
      'future native adapter can take over',
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
      'scanLocalMusicInfosFromPaths',
      'readLocalAudioMetadata',
      'readLocalAudioHeaderInfo',
      'parseFile(filePath, { duration: true })',
      'readFileSlice(filePath, LOCAL_AUDIO_HEADER_BYTES)',
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
  assertNotIncludes(
    read('src/renderer-react/services/localAudioService.ts'),
    ['readFile(filePath)'],
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
      'localAudioService.scanLocalMusicInfosFromPaths',
      'skippedCount',
      'candidateCount',
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
      'handleImportLocalAudioFolder',
      'player.localAudio.supportedExts',
      'const externalExtensions = externalDecoderExtensions',
      'importLocalAudioPathsToLocalList',
      'createLocalAudioImportDialogOptions',
      'createLocalAudioFolderImportDialogOptions',
      'skippedCount',
      '本地音频',
      '文件夹',
    ],
    'src/renderer-react/features/list/LocalListRoutePanel.tsx',
  );
  assertIncludes(
    read('src/renderer-react/services/localAudioDialogService.ts'),
    [
      'createLocalAudioImportDialogOptions',
      'createLocalAudioFolderImportDialogOptions',
      "{ extensions: ['*'], name: 'All Files' }",
      "'openDirectory'",
      "platform === 'win32'",
    ],
    'src/renderer-react/services/localAudioDialogService.ts',
  );
  assertNotIncludes(
    read('src/renderer-react/features/list/LocalListRoutePanel.tsx'),
    ["name: '音频文件'", "name: '本地音频文件'"],
    'src/renderer-react/features/list/LocalListRoutePanel.tsx',
  );
});

record('local audio import dialog keeps Windows files visible', () => {
  const { createLocalAudioFolderImportDialogOptions, createLocalAudioImportDialogOptions } =
    loadTsModule('src/renderer-react/services/localAudioDialogService.ts');
  const winOptions = createLocalAudioImportDialogOptions('win32');
  assert(
    winOptions.filters.length === 1 &&
      winOptions.filters[0].name === 'All Files' &&
      winOptions.filters[0].extensions[0] === '*',
    'Windows picker should use All Files and leave filtering to localAudioService',
  );
  assert(winOptions.properties.includes('openFile'), 'Windows picker should show files');
  assert(winOptions.properties.includes('multiSelections'), 'Windows picker should allow multiple');
  assert(
    !winOptions.properties.includes('openDirectory'),
    'Windows file picker should not mix openDirectory with openFile',
  );

  const folderOptions = createLocalAudioFolderImportDialogOptions();
  assert(
    folderOptions.properties.includes('openDirectory') &&
      folderOptions.properties.includes('multiSelections') &&
      !folderOptions.properties.includes('openFile'),
    'folder picker should be a separate directory-only dialog',
  );
  assert(folderOptions.title.includes('文件夹'), 'folder picker title should mention folders');

  const macOptions = createLocalAudioImportDialogOptions('darwin');
  assert(macOptions.properties.includes('openDirectory'), 'non-Windows picker can include folders');
});

record('drag and drop imports local audio into the local music list', () => {
  assertIncludes(
    read('src/renderer-react/app/AppShell.tsx'),
    [
      'getDroppedFilePaths',
      '../services/droppedFilePathService',
      'handleFileDrop',
      'onDragOver={handleFileDragOver}',
      'onDrop={handleFileDrop}',
      'importLocalAudioPathsToLocalList',
      'skippedCount',
      'const externalExtensions = externalDecoderExtensions',
      '松开导入到本地音乐',
    ],
    'src/renderer-react/app/AppShell.tsx',
  );
  assertIncludes(
    read('src/renderer-react/services/droppedFilePathService.ts'),
    [
      'getDroppedFilePath',
      'getDroppedFilePaths',
      'getDroppedFilePathsFromEntries',
      'dataTransfer.items',
      'getPathForFile',
      'new Set',
    ],
    'src/renderer-react/services/droppedFilePathService.ts',
  );
  assertIncludes(
    read('src/renderer-react/styles/index.css'),
    ['coral-file-drop-overlay', 'coral-file-drop-panel'],
    'src/renderer-react/styles/index.css',
  );
});

record('dropped file path service handles mixed file and folder drops', () => {
  const { getDroppedFilePath, getDroppedFilePathsFromEntries } = loadTsModule(
    'src/renderer-react/services/droppedFilePathService.ts',
  );
  const folderFile = { path: ' /music/Album ' };
  const directFile = { path: '/music/song.flac' };
  const fallbackFile = {};
  const items = [
    { kind: 'file', getAsFile: () => directFile },
    { kind: 'file', getAsFile: () => fallbackFile },
    { kind: 'string', getAsFile: () => ({ path: '/music/ignored.mp3' }) },
  ];
  const webUtils = {
    getPathForFile: (file) => (file === fallbackFile ? ' /music/fallback.webm ' : ''),
  };
  assert(
    getDroppedFilePath(fallbackFile, webUtils) === '/music/fallback.webm',
    'single dropped file should use Electron webUtils fallback',
  );
  const paths = getDroppedFilePathsFromEntries(
    [folderFile, directFile, { path: '   ' }, fallbackFile],
    items,
    webUtils,
  );
  assert(paths.length === 3, 'drop path service should dedupe mixed files and items');
  assert(paths[0] === '/music/Album', 'folder path should be trimmed and preserved');
  assert(paths.includes('/music/song.flac'), 'direct file path should be preserved');
  assert(paths.includes('/music/fallback.webm'), 'items fallback file path should be preserved');
  assert(
    paths.filter((pathValue) => pathValue === '/music/fallback.webm').length === 1,
    'fallback file path should be de-duplicated across files and items',
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
      'ExternalDecoderStreamParams',
      'ExternalDecoderStreamResult',
      'inputFormat?: string | null',
    ],
    'src/shared/playbackCapabilities.ts',
  );
  assertIncludes(
    read('src/common/ipcNames.ts'),
    [
      'external_decoder_probe',
      'external_decoder_transcode',
      'external_decoder_create_stream',
      'external_decoder_revoke_stream',
    ],
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
      'ExternalDecoderStreamParams',
      'ExternalDecoderStreamResult',
      'externalDecoderCreateStream',
      'externalDecoderRevokeStream',
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
      'createExternalDecoderStream',
      'revokeExternalDecoderStream',
      'createExternalDecoderStreamArgs',
      'handleStreamRequest',
      'cleanupExpiredStreamTokens',
      'streamTokens.delete(token)',
      'startupTimedOut',
      'startupTimer',
      '内嵌 FFmpeg 启动解码超时',
      'writeAudioHeaders',
      "child.stdout.once('data'",
      "res.on('close'",
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
    read('build-config/native-ape-helper/coral-ape-helper.cpp'),
    [
      'CreateIAPEDecompress',
      'GetData',
      'FillWaveHeader',
      '--start-ms',
      '--end-ms',
      '--smoke-encode-wav-to-ape',
    ],
    'build-config/native-ape-helper/coral-ape-helper.cpp',
  );
  assertIncludes(
    read('build-config/build-native-ape-helper.js'),
    ['MAC_1317_SDK.zip', 'MAC_SDK_DIR', 'clang++', 'coral-ape-helper'],
    'build-config/build-native-ape-helper.js',
  );
  assertIncludes(
    read('build-config/smoke-native-ape-helper.js'),
    ['native ape helper roundtrips generated ape range to wav', 'CORAL_REQUIRE_NATIVE_APE_HELPER'],
    'build-config/smoke-native-ape-helper.js',
  );
  assertIncludes(
    read('src/shared/externalDecoderStreamArgs.ts'),
    ['createExternalDecoderStreamArgs', 'inputFormat', "'-ss'", "'-t'", "'pcm_s16le'", "'pipe:1'"],
    'src/shared/externalDecoderStreamArgs.ts',
  );
  assertIncludes(
    read('src/main/modules/winMain/rendererEvent/app.ts'),
    [
      'external_decoder_probe',
      'external_decoder_transcode',
      'external_decoder_create_stream',
      'external_decoder_revoke_stream',
      'probeExternalDecoder(params)',
      'transcodeExternalDecoder(params)',
      'createExternalDecoderStream(params)',
      'revokeExternalDecoderStream(params)',
    ],
    'src/main/modules/winMain/rendererEvent/app.ts',
  );
  assertIncludes(
    read('src/renderer-react/services/externalDecoderService.ts'),
    [
      'probeExternalDecoder',
      'transcodeExternalDecoder',
      'createExternalDecoderStream',
      'revokeExternalDecoderStream',
      'externalDecoderProbe',
      'externalDecoderTranscode',
      'externalDecoderCreateStream',
      'externalDecoderRevokeStream',
      'Electron IPC is unavailable.',
    ],
    'src/renderer-react/services/externalDecoderService.ts',
  );
});

record('external decoder stream args preserve cue ranges', () => {
  const { createExternalDecoderStreamArgs } = loadTsModule(
    'src/shared/externalDecoderStreamArgs.ts',
  );
  const rangedArgs = createExternalDecoderStreamArgs({
    endMs: 65_500,
    inputPath: '/music/album.ape',
    startMs: 12_250,
  });
  assert(
    rangedArgs.join(' ') ===
      '-hide_banner -loglevel error -ss 12.250 -i /music/album.ape -t 53.250 -vn -acodec pcm_s16le -ar 44100 -ac 2 -f wav pipe:1',
    'stream args should include cue start and duration range',
  );
  const wholeFileArgs = createExternalDecoderStreamArgs({
    endMs: null,
    inputPath: '/music/album.ape',
    startMs: 0,
  });
  assert(!wholeFileArgs.includes('-ss'), 'whole file stream should not include zero seek');
  assert(!wholeFileArgs.includes('-t'), 'whole file stream should not include duration');
  const invalidRangeArgs = createExternalDecoderStreamArgs({
    endMs: 10_000,
    inputPath: '/music/album.ape',
    startMs: 15_000,
  });
  assert(
    !invalidRangeArgs.includes('-t'),
    'invalid end-before-start range should not emit duration',
  );
  const dffArgs = createExternalDecoderStreamArgs({
    endMs: null,
    inputFormat: 'iff',
    inputPath: '/music/album.dff',
    startMs: 0,
  });
  assert(
    dffArgs.join(' ') ===
      '-hide_banner -loglevel error -f iff -i /music/album.dff -vn -acodec pcm_s16le -ar 44100 -ac 2 -f wav pipe:1',
    'dff stream args should force the IFF demuxer before input',
  );
});

record('external decoder provider selection keeps native ape behind ffmpeg fallback', () => {
  assertIncludes(
    read('src/shared/externalDecoderProviders.ts'),
    [
      'externalDecoderStreamProviders',
      'createExternalDecoderStreamProviders',
      'native-ape',
      'selectExternalDecoderStreamProvider',
      'zeroConfig',
      'packaged',
      'status',
      'planned',
      'ffmpeg',
    ],
    'src/shared/externalDecoderProviders.ts',
  );
  assertIncludes(
    read('src/main/modules/winMain/externalDecoderRuntime.ts'),
    [
      'getNativeApeHelperPath',
      'CORAL_NATIVE_APE_HELPER_PATH',
      'coral-ape-helper.exe',
      'coral-ape-helper',
      'isNativeApeHelperAvailable',
      'createExternalDecoderStreamProviders',
      'createNativeApeHelperStreamArgs',
      'fallbackToFfmpeg',
      'selectExternalDecoderStreamProvider',
    ],
    'src/main/modules/winMain/externalDecoderRuntime.ts',
  );

  const {
    createExternalDecoderStreamProviders,
    externalDecoderStreamProviders,
    selectExternalDecoderStreamProvider,
  } = loadTsModule('src/shared/externalDecoderProviders.ts');
  const { createNativeApeHelperStreamArgs } = loadTsModule('src/shared/nativeApeHelperArgs.ts');

  const plannedApeProvider = externalDecoderStreamProviders.find(
    (provider) => provider.id === 'native-ape',
  );
  assert(plannedApeProvider?.status === 'planned', 'native ape provider should not be active yet');
  assert(plannedApeProvider?.zeroConfig === false, 'native ape should stay disabled until bundled');

  const currentApeSelection = selectExternalDecoderStreamProvider('/music/album.ape');
  assert(
    currentApeSelection.provider.id === 'ffmpeg',
    'ape should fall back to ffmpeg until native provider is packaged and zero-config',
  );
  assert(
    currentApeSelection.fallbackProviderId === 'ffmpeg',
    'ape selection should expose ffmpeg as fallback provider',
  );

  const nativeReadySelection = selectExternalDecoderStreamProvider(
    '/music/album.ape',
    createExternalDecoderStreamProviders({ nativeApeAvailable: true }),
  );
  assert(
    nativeReadySelection.provider.id === 'native-ape',
    'native ape should take over only after it becomes packaged and zero-config',
  );
  assert(
    nativeReadySelection.fallbackProviderId === 'ffmpeg',
    'native ape should keep ffmpeg as invisible fallback',
  );

  const dffSelection = selectExternalDecoderStreamProvider('/music/album.dff');
  assert(dffSelection.provider.id === 'ffmpeg', 'dff should continue to use ffmpeg stream');
  const webmSelection = selectExternalDecoderStreamProvider('/music/live.webm');
  assert(webmSelection.provider.id === 'ffmpeg', 'webm should have an ffmpeg stream fallback');

  const helperArgs = createNativeApeHelperStreamArgs({
    endMs: 65_500,
    inputPath: '/music/album.ape',
    startMs: 12_250,
  });
  assert(
    helperArgs.join(' ') ===
      '--input /music/album.ape --format wav --start-ms 12250 --end-ms 65500',
    'native ape helper args should preserve cue start and end ranges',
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
      'WEBM_DEMUX_MAX_BYTES',
      'getFileSize(normalizedFilePath)',
      'if (internalDecoded) return internalDecoded',
      'decodedFilePath',
      'objectUrl',
      'externalDecoderService.transcodeExternalDecoder',
      'externalDecoderService.createExternalDecoderStream',
      'externalStreamToken',
      'getExternalDecoderInputFormat',
      "case 'dff':",
      "return 'iff'",
      '内置解码输出读取失败，请检查应用完整性或重新安装。',
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
      'FFmpeg 转码输出文件读取失败',
      '必须走 FFmpeg 转码',
    ],
    file,
  );
  assertIncludes(
    read('src/renderer-react/services/playerRuntime/htmlAudioRuntime.ts'),
    [
      'currentDecodedFilePath',
      'currentObjectUrl',
      'currentExternalStreamToken',
      'currentExternalStreamDuration',
      'currentExternalStreamProgressOffset',
      'calculateAudioSnapshotTimes',
      'normalizeExternalStreamSeekSeconds',
      'decodedAudioBuffer',
      'AudioBufferSourceNode',
      'createAudioBuffer',
      'playDecodedAudio',
      'copyToChannel',
      'clearDecodedFile',
      'clearObjectUrl',
      'clearExternalStreamToken',
      'revokeExternalDecoderStream',
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
      'decodeWebmToWav',
      'internalAudioDecodeExtensions',
      'URL.createObjectURL',
    ],
    'src/renderer-react/services/playerRuntime/localAudioDecodeService.ts',
  );
  assertIncludes(
    read('src/renderer-react/services/playerRuntime/webmDemuxDecodeService.ts'),
    ['WebDemuxer', 'AudioDecoder', 'web-demuxer.wasm', 'decodeWebmToWav'],
    'src/renderer-react/services/playerRuntime/webmDemuxDecodeService.ts',
  );
  assertIncludes(
    read('build-config/vite/renderer.config.ts'),
    ['webDemuxerWasmPlugin', 'web-demuxer.wasm', 'generateBundle', 'configureServer'],
    'build-config/vite/renderer.config.ts',
  );
  assertIncludes(
    read('src/renderer-react/services/playerRuntime/audioSnapshotMath.ts'),
    [
      'calculateAudioSnapshotTimes',
      'normalizeExternalStreamSeekSeconds',
      'externalStreamProgressOffset',
      'externalStreamDuration',
    ],
    'src/renderer-react/services/playerRuntime/audioSnapshotMath.ts',
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
    read('src/renderer-react/stores/domains/playerStore.ts'),
    ['needsExternalDecoder', '配置解码器'],
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

record('play queue exposes favorite and download actions', () => {
  assertIncludes(
    read('src/renderer-react/components/player/PlayQueueBtn.tsx'),
    [
      'FavoriteSongBtn',
      'DownloadQualityModal',
      'createWebDavDownloadInfo',
      'handleDownload',
      'DeleteOutlined',
      'player.removeQueueItem(item)',
    ],
    'src/renderer-react/components/player/PlayQueueBtn.tsx',
  );
  assertIncludes(
    read('src/renderer-react/stores/domains/playerStore.ts'),
    ['removeQueueItem', 'this.runtime.stop()', 'this.playQueue.filter'],
    'src/renderer-react/stores/domains/playerStore.ts',
  );
  assertIncludes(
    read('src/renderer-react/components/player/FavoriteSongBtn.tsx'),
    ['event.stopPropagation()', 'toggleFavoriteSong'],
    'src/renderer-react/components/player/FavoriteSongBtn.tsx',
  );
});

record('external stream snapshot math preserves cue seek progress', () => {
  const { calculateAudioSnapshotTimes, normalizeExternalStreamSeekSeconds } = loadTsModule(
    'src/renderer-react/services/playerRuntime/audioSnapshotMath.ts',
  );

  assert(
    normalizeExternalStreamSeekSeconds(240, 180) === 180,
    'external stream seek should clamp to cue track duration',
  );
  assert(
    normalizeExternalStreamSeekSeconds(-5, 180) === 0,
    'external stream seek should clamp negative values to zero',
  );
  assert(
    normalizeExternalStreamSeekSeconds(Number.NaN, 180) === 0,
    'external stream seek should clamp invalid values to zero',
  );
  assert(
    normalizeExternalStreamSeekSeconds(240, null) === 240,
    'external stream seek should preserve target when duration is unknown',
  );
  assert(
    calculateAudioSnapshotTimes({
      currentTime: 12,
      externalStreamDuration: 180,
      externalStreamProgressOffset: 30,
      nativeDuration: Number.POSITIVE_INFINITY,
    }).progress === 42,
    'external stream progress should include seek offset',
  );
  assert(
    calculateAudioSnapshotTimes({
      currentTime: 240,
      externalStreamDuration: 180,
      externalStreamProgressOffset: 30,
      nativeDuration: Number.POSITIVE_INFINITY,
    }).progress === 180,
    'external stream progress should clamp to cue track duration',
  );
  assert(
    calculateAudioSnapshotTimes({
      currentTime: 12,
      externalStreamDuration: 180,
      externalStreamProgressOffset: 30,
      isEnded: true,
      nativeDuration: Number.POSITIVE_INFINITY,
    }).progress === 180,
    'ended external stream progress should jump to track duration',
  );
  const nativeSnapshot = calculateAudioSnapshotTimes({
    currentTime: 7,
    nativeDuration: 60,
  });
  assert(nativeSnapshot.duration === 60, 'native duration should be preserved');
  assert(nativeSnapshot.progress === 7, 'native progress should be preserved');
});

record('ape cue and sfv album import is modeled as local virtual tracks', () => {
  assertIncludes(
    read('src/common/types/music.d.ts'),
    [
      'albumFilePath',
      'cuePath',
      'sfvExpectedCrc32',
      'sfvPath',
      'sfvStatus',
      'trackStartMs',
      'trackEndMs',
      'trackNo',
    ],
    'src/common/types/music.d.ts',
  );
  assertIncludes(
    read('src/shared/localAlbumCueParser.ts'),
    [
      'parseCueTracks',
      'parseSfvFiles',
      'calculateCrc32',
      'getParsedSfvStatus',
      'parseCueTimeMs',
      'resolveSidecarPath',
      'INDEX',
      'PERFORMER',
    ],
    'src/shared/localAlbumCueParser.ts',
  );
  assertIncludes(
    read('src/renderer-react/services/localAlbumCueService.ts'),
    [
      'readCueTracks',
      'readSfvFiles',
      'completeCueTrackEndTimes',
      'createCueTrackMusicInfo',
      'hasSfvSidecar',
      'sfvExpectedCrc32',
      'parseCueTracks',
      'parseSfvFiles',
      'gb18030',
    ],
    'src/renderer-react/services/localAlbumCueService.ts',
  );
  assertIncludes(
    read('src/renderer-react/services/localAudioService.ts'),
    [
      'isCueFile',
      'isSfvFile',
      'readCueTracks',
      'readSfvFiles',
      'getSfvInfoByAudioPath',
      'completeCueTrackEndTimes',
      'createCueTrackMusicInfo',
      'cueAudioPaths',
      'standaloneAudioPaths',
    ],
    'src/renderer-react/services/localAudioService.ts',
  );
  assertIncludes(
    read('src/renderer-react/services/localAudioService.ts'),
    ['const cueTracks = completeCueTrackEndTimes(rawCueTracks, durationByFilePath)'],
    'src/renderer-react/services/localAudioService.ts',
  );
  assertNotIncludes(
    read('src/renderer-react/services/localAudioService.ts'),
    ['const cueTracks = await readCueTracks(cuePath, durationByFilePath)'],
    'src/renderer-react/services/localAudioService.ts',
  );
});

record('ape cue and sfv parser handles album fixtures', () => {
  const {
    calculateCrc32,
    getParsedSfvStatus,
    parseCueTimeMs,
    parseCueTracks,
    parseSfvFiles,
    resolveSidecarPath,
  } = loadTsModule('src/shared/localAlbumCueParser.ts');
  const pathTools = {
    basename: path.basename,
    dirname: path.dirname,
    joinPath: path.join,
  };
  const cuePath = path.join('/music', 'Album', 'disc.cue');
  const cueContent = `
REM GENRE "Jazz"
REM DATE 1999
PERFORMER "Album Artist"
TITLE "Album Title"
FILE "CD1\\album.ape" WAVE
  TRACK 01 AUDIO
    TITLE "Intro"
    PERFORMER "Track Artist"
    INDEX 00 00:00:00
    INDEX 01 00:00:00
  TRACK 02 AUDIO
    TITLE "Second Song"
    INDEX 01 04:05:37
FILE "CD2/bonus.ape" WAVE
  TRACK 03 AUDIO
    TITLE "Bonus"
    INDEX 01 00:00:00
`;
  const tracks = parseCueTracks(cueContent, cuePath, pathTools);
  assert(tracks.length === 3, 'expected three cue tracks');
  assert(tracks[0].albumArtist === 'Album Artist', 'album performer not propagated');
  assert(tracks[0].albumName === 'Album Title', 'album title not propagated');
  assert(tracks[0].genre === 'Jazz', 'genre not parsed');
  assert(tracks[0].year === '1999', 'year not parsed');
  assert(tracks[0].performer === 'Track Artist', 'track performer not parsed');
  assert(tracks[1].title === 'Second Song', 'track title not parsed');
  assert(
    tracks[0].filePath === path.join('/music', 'Album', 'CD1', 'album.ape'),
    'backslash cue path not normalized',
  );
  assert(
    tracks[1].startMs === Math.round((4 * 60 + 5 + 37 / 75) * 1000),
    'cue index time not converted from frames',
  );
  assert(
    tracks[2].filePath === path.join('/music', 'Album', 'CD2', 'bonus.ape'),
    'slash cue path not resolved',
  );
  assert(parseCueTimeMs('bad') == null, 'invalid cue time should be null');
  assert(
    resolveSidecarPath('/music/Album', 'CD3\\extra.ape', pathTools) ===
      path.join('/music', 'Album', 'CD3', 'extra.ape'),
    'sidecar path should resolve nested Windows paths',
  );
  assert(
    resolveSidecarPath('/music/Album', 'C:\\Rips\\album.ape', pathTools) === 'C:\\Rips\\album.ape',
    'sidecar path should preserve Windows absolute paths',
  );
  assert(
    resolveSidecarPath('/music/Album', 'file:///C:/Rips/album.ape', pathTools) ===
      'C:\\Rips\\album.ape',
    'sidecar path should preserve Windows file URI paths',
  );
  assert(
    resolveSidecarPath('/music/Album', 'file:///Volumes/Rips/album.ape', pathTools) ===
      '/Volumes/Rips/album.ape',
    'sidecar path should preserve Unix file URI paths',
  );
  assert(
    resolveSidecarPath('/music/Album', '/mnt/rips/album.ape', pathTools) === '/mnt/rips/album.ape',
    'sidecar path should preserve rooted paths',
  );

  const sfvFiles = parseSfvFiles(
    `
; generated by album ripper
CD1\\album.ape abcd1234
CD2/bonus.ape 0000ffff
`,
    path.join('/music', 'Album', 'disc.sfv'),
    pathTools,
  );
  assert(sfvFiles.length === 2, 'expected two sfv files');
  assert(sfvFiles[0].expectedCrc32 === 'ABCD1234', 'sfv crc should be uppercase');
  assert(sfvFiles[0].fileName === 'album.ape', 'sfv basename not parsed');
  assert(
    sfvFiles[0].filePath === path.join('/music', 'Album', 'CD1', 'album.ape'),
    'sfv path not resolved',
  );
  assert(
    calculateCrc32(new TextEncoder().encode('123456789')) === 'CBF43926',
    'sfv crc32 helper should match the standard check vector',
  );
  assert(
    getParsedSfvStatus(true, true) === 'unchecked',
    'matching sfv entry should remain unchecked until full-file verification runs',
  );
  assert(
    getParsedSfvStatus(true, false) === 'missing',
    'sfv sidecar without matching entry should mark the track missing',
  );
  assert(
    getParsedSfvStatus(false, false) === undefined,
    'track without any sfv sidecar should not show an sfv status',
  );
});

record('user api playback selection validates musicUrl capability', () => {
  assertIncludes(
    read('src/renderer-react/services/musicSdk/sdk/api-source.js'),
    ["throw new Error('Api is not found')", 'userApi.apis[source]'],
    'src/renderer-react/services/musicSdk/sdk/api-source.js',
  );
  assertIncludes(
    read('src/renderer-react/services/playerRuntime/musicUrlResolver.ts'),
    [
      '/getMusicUrl/.test(message)',
      'const otherSourceList = await fetchOtherSourceMusicList(musicInfo)',
      "throw new Error('当前没有可用音源，请先通过“添加音源”导入并启用 User API。')",
    ],
    'src/renderer-react/services/playerRuntime/musicUrlResolver.ts',
  );
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
    ['内置解码能力', '原生解码器', '流式解码', '用户无需配置'],
    'src/renderer-react/features/settings/SettingsRoutePanel.tsx',
  );
  assertNotIncludes(
    read('src/renderer-react/features/settings/SettingsRoutePanel.tsx'),
    [
      '临时 WAV',
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
    [
      'UiQuickAction',
      'configureLocalAudioImport',
      'configureExternalDecoder',
      'requestQuickAction',
      'consumeQuickAction',
    ],
    'src/renderer-react/stores/domains/uiStore.ts',
  );
  assertIncludes(
    read('src/renderer-react/features/settings/SettingsRoutePanel.tsx'),
    [
      'externalDecoderSectionRef',
      "ui.consumeQuickAction('configureLocalAudioImport')",
      "ui.consumeQuickAction('configureExternalDecoder')",
      'scrollIntoView',
    ],
    'src/renderer-react/features/settings/SettingsRoutePanel.tsx',
  );
  assertIncludes(
    read('src/renderer-react/features/list/LocalListRoutePanel.tsx'),
    [
      '本地音频导入已关闭',
      'configureLocalAudioImport',
      'handleCreateLocalList',
      '当前列表暂无歌曲',
      '导入本地音频',
      'importLocalAudioPathsToLocalList',
      '无效或不可用条目',
    ],
    'src/renderer-react/features/list/LocalListRoutePanel.tsx',
  );
  assertIncludes(
    read('src/renderer-react/app/AppShell.tsx'),
    ['本地音频导入已关闭', 'configureLocalAudioImport'],
    'src/renderer-react/app/AppShell.tsx',
  );
  assertNotIncludes(
    read('src/renderer-react/app/AppShell.tsx'),
    ["requestQuickAction('configureExternalDecoder')"],
    'src/renderer-react/app/AppShell.tsx',
  );
  assertNotIncludes(
    read('src/renderer-react/features/list/LocalListRoutePanel.tsx'),
    ["requestQuickAction('configureExternalDecoder')"],
    'src/renderer-react/features/list/LocalListRoutePanel.tsx',
  );
});

record('release smoke includes playback capability guard', () => {
  const pkg = JSON.parse(read('package.json'));
  assert(pkg.scripts['smoke:playback-capabilities'], 'missing smoke:playback-capabilities');
  assert(pkg.scripts['smoke:local-audio-fixtures'], 'missing smoke:local-audio-fixtures');
  assert(pkg.scripts['smoke:external-audio-samples'], 'missing smoke:external-audio-samples');
  assertIncludes(
    read('build-config/smoke-local-audio-fixtures.js'),
    [
      'local audio scanner imports cue and sfv album tracks',
      'local audio scanner marks missing sfv entries',
      'scanLocalMusicInfosFromPaths',
      'sfvExpectedCrc32',
      "sfvStatus === 'unchecked'",
      "sfvStatus === 'missing'",
    ],
    'build-config/smoke-local-audio-fixtures.js',
  );
  assert(
    pkg.scripts['smoke:release'].includes('smoke:playback-capabilities'),
    'smoke:release should include playback capability smoke',
  );
  assert(
    pkg.scripts['smoke:release'].includes('smoke:local-audio-fixtures'),
    'smoke:release should include generated local audio fixture smoke',
  );
});

if (failures.length) {
  console.error(`\n[playbackCapabilitySmoke] ${failures.length} check(s) failed`);
  process.exit(1);
}

console.log('\n[playbackCapabilitySmoke] passed');
