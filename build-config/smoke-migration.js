const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const failures = [];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const record = (name, fn) => {
  try {
    fn();
    console.log(`[migrationSmoke] ok ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`[migrationSmoke] fail ${name}: ${error.message}`);
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

const walk = (dir) => {
  const target = path.join(root, dir);
  if (!fs.existsSync(target)) return [];
  const results = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const fullPath = path.join(target, entry.name);
    const relativePath = path.relative(root, fullPath);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      results.push(...walk(relativePath));
    } else {
      results.push(relativePath);
    }
  }
  return results;
};

record('active renderer routes are React panels', () => {
  const file = 'src/renderer-react/app/routeConfig.tsx';
  const content = read(file);
  assertIncludes(
    content,
    [
      "RendererRouteKey = 'search' | 'song-list' | 'leaderboard' | 'list' | 'download' | 'setting'",
      'lazy(async()',
      "import('../features/download/DownloadRoutePanel')",
      "import('../features/leaderboard/LeaderboardRoutePanel')",
      "import('../features/list/LocalListRoutePanel')",
      "import('../features/search/SearchRoutePanel')",
      "import('../features/settings/SettingsRoutePanel')",
      "import('../features/song-list/SongListRoutePanel')",
    ],
    file,
  );
});

record('online route services expose migrated surfaces', () => {
  const file = 'src/renderer-react/services/onlineMusicService.ts';
  const content = read(file);
  assertIncludes(
    content,
    [
      'export const searchMusic',
      'export const searchSongLists',
      'export const getSongLists',
      'export const getSongListDetail',
      'export const getLeaderboardBoards',
      'export const getLeaderboardDetail',
    ],
    file,
  );
});

record('online feature panels use MobX stores', () => {
  const panels = [
    [
      'src/renderer-react/features/search/SearchRoutePanel.tsx',
      ['rootStore', 'search.submitSearch', 'search.activeMusicList'],
    ],
    [
      'src/renderer-react/features/song-list/SongListRoutePanel.tsx',
      ['rootStore', 'songList.loadList', 'songList.loadListDetail'],
    ],
    [
      'src/renderer-react/features/leaderboard/LeaderboardRoutePanel.tsx',
      ['rootStore', 'leaderboard.loadBoards', 'leaderboard.loadListDetail'],
    ],
    [
      'src/renderer-react/features/list/LocalListRoutePanel.tsx',
      ['rootStore', 'DraggableMusicList'],
    ],
    [
      'src/renderer-react/features/download/DownloadRoutePanel.tsx',
      ['rootStore', 'download.startTask', 'download.pauseTask'],
    ],
  ];
  for (const [file, needles] of panels) {
    assert(exists(file), `${file} not found`);
    assertIncludes(read(file), needles, file);
  }
});

record('download runtime typed IPC is wired', () => {
  const contractsFile = 'src/shared/ipc/contracts.ts';
  const ipcNamesFile = 'src/common/ipcNames.ts';
  const runtimeFile = 'src/main/modules/winMain/downloadRuntime.ts';
  const rendererEventFile = 'src/main/modules/winMain/rendererEvent/download.ts';
  const serviceFile = 'src/renderer-react/services/downloadService.ts';
  const storeFile = 'src/renderer-react/stores/domains/downloadStore.ts';
  assertIncludes(
    read(contractsFile),
    ['downloadTaskStart', 'downloadTaskPause', 'downloadTaskRetry', 'downloadTaskAction'],
    contractsFile,
  );
  assertIncludes(
    read(ipcNamesFile),
    ['download_task_start', 'download_task_pause', 'download_task_retry', 'download_task_action'],
    ipcNamesFile,
  );
  assertIncludes(
    read(runtimeFile),
    [
      'export const startDownloadTask',
      'export const pauseDownloadTask',
      'await global.coral.worker.dbService.getDownloadList()',
      'await global.coral.worker.dbService.getPlayerLyric',
    ],
    runtimeFile,
  );
  assertIncludes(
    read(rendererEventFile),
    ['download_task_start', 'download_task_pause', 'download_task_retry'],
    rendererEventFile,
  );
  assertIncludes(
    read(serviceFile),
    ['resolvePlayableMusicUrl', 'onDownloadTaskAction', 'downloadTaskStart', 'downloadTaskPause'],
    serviceFile,
  );
  assertIncludes(
    read(storeFile),
    ['bindRuntime()', 'pumpQueue()', 'shouldAutoRetry', 'downloadService.startDownloadTask'],
    storeFile,
  );
});

record('download smoke command is available', () => {
  const content = read('package.json');
  assertIncludes(content, ['"smoke:download"', 'CORAL_DOWNLOAD_SMOKE=true'], 'package.json');
});

record('data path uses Coral names', () => {
  const appFile = 'src/main/app.ts';
  const dbFile = 'src/main/worker/dbService/db.ts';
  assertIncludes(
    read(appFile),
    [
      "const CORAL_DATA_DIR_NAME = 'CoralDatas'",
      "const CORAL_DB_NAME = 'coral.data.db'",
      'global.coralDataPath = path.join(userDataPath, CORAL_DATA_DIR_NAME)',
      'if (!existsSync(global.coralDataPath)) mkdirSync(global.coralDataPath)',
    ],
    appFile,
  );
  assertIncludes(read(dbFile), ["path.join(coralDataPath, 'coral.data.db')"], dbFile);
});

record('legacy renderer bridges are absent from React and lyric renderers', () => {
  const files = walk('src/renderer-react').concat(walk('src/lyric-react'));
  const forbidden = ['window.coral.worker', '@renderer/', '../../renderer', '../../../renderer'];
  const hits = [];
  for (const file of files) {
    if (!/\.(ts|tsx|js|jsx)$/.test(file)) continue;
    const content = read(file);
    for (const needle of forbidden) {
      if (content.includes(needle)) hits.push(`${file}: ${needle}`);
    }
  }
  assert(hits.length === 0, hits.join('; '));
});

record('deprecated antd List usage is absent from migrated React panels', () => {
  const files = walk('src/renderer-react').concat(walk('src/lyric-react'));
  const patterns = [
    /\bList as AntList\b/,
    /import\s+\{[^\n}]*\bList\b[^\n}]*\}\s+from ['"]antd['"]/,
    /<AntList\b/,
    /<List\b/,
    /\bAntList\.Item\b/,
    /\bList\.Item\b/,
  ];
  const hits = [];
  for (const file of files) {
    if (!/\.(ts|tsx|js|jsx)$/.test(file)) continue;
    const content = read(file);
    for (const pattern of patterns) {
      if (pattern.test(content)) hits.push(`${file}: ${pattern}`);
    }
  }
  assert(hits.length === 0, hits.join('; '));
});

record('music sdk stays behind lazy service boundaries', () => {
  const files = walk('src/renderer-react/services');
  const hits = [];
  for (const file of files) {
    if (!/\.(ts|tsx)$/.test(file)) continue;
    const content = read(file);
    if (/import\s+[\s\S]*?from ['"].*musicSdk\/sdk['"]/.test(content)) hits.push(file);
  }
  assert(hits.length === 0, `static music sdk imports found: ${hits.join(', ')}`);
});

if (failures.length) {
  console.error(`\n[migrationSmoke] ${failures.length} check(s) failed`);
  process.exit(1);
}

console.log('\n[migrationSmoke] passed');
