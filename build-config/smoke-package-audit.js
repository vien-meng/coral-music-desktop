const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const failures = [];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const record = (name, fn) => {
  try {
    fn();
    console.log(`[packageAudit] ok ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`[packageAudit] fail ${name}: ${error.message}`);
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
    assert(!content.includes(needle), `${file} still contains ${needle}`);
  }
};

record('package identity is coral', () => {
  const pkg = JSON.parse(read('package.json'));
  assert(pkg.name === 'coral-music-desktop', `unexpected package name ${pkg.name}`);
  assert(pkg.description.includes('珊瑚音乐'), 'package description should mention 珊瑚音乐');
  assert(pkg.description.includes('React'), 'package description should mention React');
  assert(pkg.author.name === 'Coral Music Team', 'package author should be Coral Music Team');
  assert(
    pkg.macLanguagesInfoPlistStrings.en.CFBundleDisplayName === 'Coral Music',
    'mac en display name mismatch',
  );
  assert(
    pkg.macLanguagesInfoPlistStrings.zh_CN.CFBundleDisplayName === '珊瑚音乐',
    'mac zh_CN display name mismatch',
  );
});

record('package repository metadata is not upstream', () => {
  const pkg = JSON.parse(read('package.json'));
  assert(pkg.repository.type === 'git', 'repository.type should be git');
  assert(
    pkg.repository.url === '',
    'repository.url should stay empty until the Coral repository is known',
  );
  assert(pkg.bugs.url === '', 'bugs.url should stay empty until the Coral issue tracker is known');
  assert(pkg.homepage === '', 'homepage should stay empty until the Coral homepage is known');
});

record('readme release status is coral-specific', () => {
  const file = 'README.md';
  const content = read(file);
  assertIncludes(
    content,
    [
      '正式 Coral Music 仓库、Issues、Releases 与发布渠道尚未配置完成',
      '不要将其他项目的 Releases 视为 Coral Music 发布渠道',
      '迁移资料、兼容文档或致谢来源',
    ],
    file,
  );
  assertNotIncludes(
    content,
    [
      'img.shields.io/github/release/vien-meng/' + 'coral-music-' + 'desktop',
      'coral-music-' + 'desktop/workflows/Build/badge.svg',
    ],
    file,
  );
});

record('user-facing upstream links are centralized', () => {
  const brandFile = 'src/shared/brand.ts';
  const brandContent = read(brandFile);
  assertIncludes(
    brandContent,
    ['coralProjectLinks', 'projectRepository', 'customSourceDocs', 'songListFaq'],
    brandFile,
  );

  const files = [
    'src/renderer-react/features/settings/SettingsRoutePanel.tsx',
    'src/renderer-react/features/song-list/components/OpenListModal.tsx',
  ];
  for (const file of files) {
    const content = read(file);
    assertIncludes(content, ['coralProjectLinks'], file);
    assertNotIncludes(
      content,
      [
        'github.com/vien-meng/' + 'coral-music-' + 'desktop',
        'vien-meng.github.io/' + 'coral-music-' + 'doc',
      ],
      file,
    );
  }
});

record('runtime fallback labels use coral brand', () => {
  const checks = [
    [
      'src/renderer-react/services/musicSdk/index.ts',
      ['coralBrand.englishName'],
      ["title ||= 'Coral " + "Music'"],
    ],
    ['src/common/utils/renderer.ts', ['coralBrand.englishName'], ["title ||= 'Coral " + "Music'"]],
    [
      'src/main/modules/tray.ts',
      ['coralBrand.englishName'],
      ["const defaultTip = 'Coral " + "Music'"],
    ],
  ];

  for (const [file, required, forbidden] of checks) {
    const content = read(file);
    assertIncludes(content, required, file);
    assertNotIncludes(content, forbidden, file);
  }
});

record('electron builder identity is coral', () => {
  const file = 'build-config/build-pack.js';
  const content = read(file);
  assertIncludes(
    content,
    [
      "appId: 'cn.coral.music.desktop'",
      "productName: 'Coral Music'",
      "name: 'coral-music-protocol'",
      "legalTrademarks: 'Coral Music'",
      "shortcutName: 'Coral Music'",
      "Name: 'Coral Music'",
      "'Name[zh_CN]': '珊瑚音乐'",
      "'Name[zh_TW]': '珊瑚音樂'",
      "title: 'Coral Music v$" + "{version}'",
    ],
    file,
  );
  assertNotIncludes(
    content,
    [
      "productName: 'coral-music-" + "desktop'",
      "appId: 'cn.toside.music.desktop'",
      "repo: 'coral-music-" + "desktop'",
    ],
    file,
  );
});

record('publish target is explicit', () => {
  const file = 'build-config/build-pack.js';
  const content = read(file);
  assertIncludes(
    content,
    ['CORAL_PUBLISH_OWNER', 'CORAL_PUBLISH_REPO', 'Missing CORAL_PUBLISH_OWNER/CORAL_PUBLISH_REPO'],
    file,
  );
  assertNotIncludes(content, ["owner: 'vien-meng'", "repo: 'coral-music-" + "desktop'"], file);
});

record('deep link scheme uses coral identity', () => {
  const file = 'build-config/build-pack.js';
  const content = read(file);
  assertIncludes(content, ["'coralmusic'", 'x-scheme-handler/coralmusic'], file);
});

record('packaging resources exist', () => {
  const required = [
    'resources/icons/icon.ico',
    'resources/icons/icon.icns',
    'resources/icons/512x512.png',
    'resources/bin/.gitkeep',
    'licenses/license.rtf',
    'licenses/license_zh.txt',
  ];
  for (const file of required) {
    assert(exists(file), `${file} not found`);
  }
});

record('zero-config decoder resources are packaged', () => {
  const packFile = 'build-config/build-pack.js';
  const mainViteFile = 'build-config/vite/main.config.ts';
  const packContent = read(packFile);
  const mainViteContent = read(mainViteFile);
  assertIncludes(
    packContent,
    [
      "'node_modules/ffmpeg-static'",
      "{ from: './resources/bin', to: 'bin', filter: ['**/*'] }",
      'asar: false',
      'ensureNativeApeHelper',
      'normalizeTargetPlatform',
      'build-native-ape-helper.js',
      'Missing native APE helper for',
      'CORAL_ALLOW_CROSS_PLATFORM_NATIVE_APE_HELPER',
      'coral-ape-helper.exe',
      'module.exports',
      'parseParams',
    ],
    packFile,
  );
  assertIncludes(
    mainViteContent,
    ["'ffmpeg-static'", "ffmpeg-static's index.js resolves its binary", 'Keep it external'],
    mainViteFile,
  );
  assert(exists('node_modules/ffmpeg-static/index.js'), 'ffmpeg-static index.js not installed');
  assert(exists('node_modules/ffmpeg-static/ffmpeg'), 'ffmpeg-static binary not installed');
  const ffmpegStats = fs.statSync(path.join(root, 'node_modules/ffmpeg-static/ffmpeg'));
  assert(ffmpegStats.size > 1024 * 1024, 'ffmpeg-static binary looks too small');
});

record('native ape helper build is release-ready', () => {
  const file = 'build-config/build-native-ape-helper.js';
  const content = read(file);
  assertIncludes(
    content,
    [
      'MAC_1317_SDK.zip',
      'CORAL_NATIVE_APE_CXX',
      'coral-ape-helper.exe',
      'cl.exe',
      'clang++',
      'PLATFORM_WINDOWS',
      'PLATFORM_APPLE',
      'PLATFORM_LINUX',
    ],
    file,
  );
});

record('bundled ffmpeg supports external local audio codecs', () => {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const ffmpegPath = require(path.join(root, 'node_modules/ffmpeg-static'));
  assert(ffmpegPath && fs.existsSync(ffmpegPath), 'ffmpeg-static did not resolve a binary path');
  const version = execFileSync(ffmpegPath, ['-hide_banner', '-version'], {
    encoding: 'utf8',
    timeout: 10_000,
  });
  assert(version.includes('ffmpeg version'), 'ffmpeg binary did not print a version');
  const decoders = execFileSync(ffmpegPath, ['-hide_banner', '-decoders'], {
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
    timeout: 10_000,
  });
  for (const decoder of ['ape', 'dsd_lsbf', 'dsd_msbf', 'dst', 'alac', 'ac3', 'opus', 'vorbis']) {
    assert(new RegExp(`\\b${decoder}\\b`).test(decoders), `ffmpeg decoder missing: ${decoder}`);
  }
  const demuxers = execFileSync(ffmpegPath, ['-hide_banner', '-demuxers'], {
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
    timeout: 10_000,
  });
  for (const demuxer of ['ape', 'dsf', 'iff', 'matroska,webm', 'mov,mp4,m4a', 'ogg', 'wav']) {
    assert(demuxers.includes(demuxer), `ffmpeg demuxer missing: ${demuxer}`);
  }
});

record('core smoke commands are registered', () => {
  const pkg = JSON.parse(read('package.json'));
  assert(pkg.scripts['smoke:migration'], 'missing smoke:migration');
  assert(pkg.scripts['smoke:download'], 'missing smoke:download');
  assert(pkg.scripts['smoke:package'], 'missing smoke:package');
  assert(pkg.scripts['smoke:build-pack-helper'], 'missing smoke:build-pack-helper');
  assert(pkg.scripts['smoke:bundle'], 'missing smoke:bundle');
  assert(pkg.scripts['smoke:playback-capabilities'], 'missing smoke:playback-capabilities');
  assert(pkg.scripts['smoke:local-audio-fixtures'], 'missing smoke:local-audio-fixtures');
  assert(pkg.scripts['smoke:external-audio-samples'], 'missing smoke:external-audio-samples');
  assert(pkg.scripts['smoke:native-ape-helper'], 'missing smoke:native-ape-helper');
  assert(pkg.scripts['smoke:windows-package'], 'missing smoke:windows-package');
  assert(pkg.scripts['smoke:windows-acceptance'], 'missing smoke:windows-acceptance');
  assert(pkg.scripts['build:native-ape-helper'], 'missing build:native-ape-helper');
  assert(pkg.scripts['smoke:dist'], 'missing smoke:dist');
  assert(pkg.scripts['smoke:release'], 'missing smoke:release');
  assert(
    pkg.scripts['smoke:release'].includes('smoke:build-pack-helper'),
    'smoke:release should run smoke:build-pack-helper',
  );
  assert(pkg.scripts['smoke:full'], 'missing smoke:full');
});

if (failures.length) {
  console.error(`\n[packageAudit] ${failures.length} check(s) failed`);
  process.exit(1);
}

console.log('\n[packageAudit] passed');
