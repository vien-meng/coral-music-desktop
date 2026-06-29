const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const failures = [];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const record = (name, fn) => {
  try {
    fn();
    console.log(`[bundleSmoke] ok ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`[bundleSmoke] fail ${name}: ${error.message}`);
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

record('renderer bundle split strategy is explicit', () => {
  const file = 'build-config/vite/renderer.config.ts';
  const content = read(file);
  assertIncludes(
    content,
    [
      'const getManualChunk =',
      'vendor-react',
      'vendor-icons',
      'vendor-antd-runtime',
      'vendor-antd-core',
      'vendor-state',
      'manualChunks: getManualChunk',
    ],
    file,
  );
  assertIncludes(content, ['antdComponent', 'vendor-antd-$' + '{antdComponent}'], file);
});

record('lyric bundle split strategy is explicit', () => {
  const file = 'build-config/vite/lyric.config.ts';
  const content = read(file);
  assertIncludes(
    content,
    [
      'const getManualChunk =',
      'lyric-font-player',
      'lyric-vendor-react',
      'lyric-vendor-icons',
      'lyric-vendor-antd-runtime',
      'lyric-vendor-antd-core',
      'lyric-vendor-state',
      'manualChunks: getManualChunk',
    ],
    file,
  );
  assertIncludes(content, ['antdComponent', 'lyric-vendor-antd-$' + '{antdComponent}'], file);
});

record('chunk warnings are not hidden by threshold overrides', () => {
  const files = ['build-config/vite/renderer.config.ts', 'build-config/vite/lyric.config.ts'];
  for (const file of files) {
    assertNotIncludes(read(file), ['chunkSizeWarningLimit'], file);
  }
});

record('routes are code split at the route boundary', () => {
  const file = 'src/renderer-react/app/routeConfig.tsx';
  const content = read(file);
  assertIncludes(
    content,
    [
      'lazy(async()',
      "import('../features/search/SearchRoutePanel')",
      "import('../features/song-list/SongListRoutePanel')",
      "import('../features/leaderboard/LeaderboardRoutePanel')",
      "import('../features/list/LocalListRoutePanel')",
      "import('../features/download/DownloadRoutePanel')",
      "import('../features/settings/SettingsRoutePanel')",
    ],
    file,
  );
});

if (failures.length) {
  console.error(`\n[bundleSmoke] ${failures.length} check(s) failed`);
  process.exit(1);
}

console.log('\n[bundleSmoke] passed');
