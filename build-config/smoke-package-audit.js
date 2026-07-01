const fs = require('node:fs');
const path = require('node:path');

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
    'licenses/license.rtf',
    'licenses/license_zh.txt',
  ];
  for (const file of required) {
    assert(exists(file), `${file} not found`);
  }
});

record('core smoke commands are registered', () => {
  const pkg = JSON.parse(read('package.json'));
  assert(pkg.scripts['smoke:migration'], 'missing smoke:migration');
  assert(pkg.scripts['smoke:download'], 'missing smoke:download');
  assert(pkg.scripts['smoke:package'], 'missing smoke:package');
  assert(pkg.scripts['smoke:bundle'], 'missing smoke:bundle');
  assert(pkg.scripts['smoke:playback-capabilities'], 'missing smoke:playback-capabilities');
  assert(pkg.scripts['smoke:dist'], 'missing smoke:dist');
  assert(pkg.scripts['smoke:release'], 'missing smoke:release');
  assert(pkg.scripts['smoke:full'], 'missing smoke:full');
});

if (failures.length) {
  console.error(`\n[packageAudit] ${failures.length} check(s) failed`);
  process.exit(1);
}

console.log('\n[packageAudit] passed');
