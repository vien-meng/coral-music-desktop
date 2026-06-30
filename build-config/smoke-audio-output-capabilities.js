const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const failures = [];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const record = (name, fn) => {
  try {
    fn();
    console.log(`[audioOutputSmoke] ok ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`[audioOutputSmoke] fail ${name}: ${error.message}`);
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

record('audio output capability types are centralized', () => {
  const file = 'src/shared/playbackCapabilities.ts';
  assertIncludes(
    read(file),
    [
      "AudioOutputMode = 'system' | 'exclusive'",
      "ExclusiveAudioOutputBackend = 'wasapi'",
      'ExclusiveAudioDevice',
      'ExclusiveAudioOutputProbeResult',
      'ExclusiveAudioOutputStatus',
      'sampleRatePolicies',
    ],
    file,
  );
});

record('default settings keep system output enabled', () => {
  const file = 'src/common/defaultSetting.ts';
  assertIncludes(
    read(file),
    [
      "'player.audioOutput.mode': 'system'",
      "'player.audioOutput.exclusiveBackend': 'wasapi'",
      "'player.audioOutput.exclusiveDeviceId': ''",
      "'player.audioOutput.exclusiveFallbackToSystem': true",
      "'player.audioOutput.exclusiveBufferMs': 100",
      "'player.audioOutput.exclusiveSampleRatePolicy': 'source'",
    ],
    file,
  );
});

record('typed ipc exposes exclusive output control surface', () => {
  const file = 'src/shared/ipc/contracts.ts';
  assertIncludes(
    read(file),
    [
      'audioOutputListDevices',
      'audioOutputProbeExclusive',
      'audioOutputStart',
      'audioOutputPause',
      'audioOutputResume',
      'audioOutputSeek',
      'audioOutputStop',
      'audioOutputStatus',
    ],
    file,
  );
});

record('main process keeps exclusive output windows-only gated', () => {
  const file = 'src/main/modules/winMain/exclusiveAudioOutputService.ts';
  assertIncludes(
    read(file),
    [
      "process.platform === 'win32'",
      'CORAL_WASAPI_HELPER_PATH',
      'coral-wasapi-helper.exe',
      'USB 独占输出第一版仅支持 Windows WASAPI Exclusive',
      'WASAPI 独占输出 helper 尚未随应用打包',
    ],
    file,
  );
});

record('renderer runtime has exclusive fallback boundary', () => {
  assertIncludes(
    read('src/renderer-react/services/playerRuntime/hybridAudioRuntime.ts'),
    [
      'createHtmlAudioPlayerRuntimeBackend',
      'createExclusiveAudioPlayerRuntimeBackend',
      "activeMode: Coral.AppSetting['player.audioOutput.mode'] = 'system'",
    ],
    'src/renderer-react/services/playerRuntime/hybridAudioRuntime.ts',
  );
  assertIncludes(
    read('src/renderer-react/services/playerRuntime/exclusiveAudioRuntime.ts'),
    [
      'resolvePlayableMusicUrl',
      'player.audioOutput.exclusiveFallbackToSystem',
      '独占输出暂不支持浏览器内存解码流',
      '已回落到系统输出',
    ],
    'src/renderer-react/services/playerRuntime/exclusiveAudioRuntime.ts',
  );
});

record('settings ui exposes usb exclusive controls', () => {
  const file = 'src/renderer-react/features/settings/SettingsRoutePanel.tsx';
  assertIncludes(
    read(file),
    [
      'USB 独占输出',
      '独占设备',
      '探测独占',
      '失败时回落到系统输出',
      'player.audioOutput.exclusiveSampleRatePolicy',
    ],
    file,
  );
});

if (failures.length) {
  console.error('\nAudio output capability smoke failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('\nAudio output capability smoke passed.');

