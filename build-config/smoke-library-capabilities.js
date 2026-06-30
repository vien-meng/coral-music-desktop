const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const failures = [];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const assertIncludes = (content, needles, file) => {
  for (const needle of needles) {
    assert(content.includes(needle), `${file} missing ${needle}`);
  }
};

const record = (name, fn) => {
  try {
    fn();
    console.log(`[librarySmoke] ok ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`[librarySmoke] fail ${name}: ${error.message}`);
  }
};

record('library types are declared', () => {
  const file = 'src/common/types/library.d.ts';
  assertIncludes(
    read(file),
    ['PlayRecord', 'FavoriteSongList', 'FavoriteAlbum', 'MusicCategoryGroup', 'PlayRecordInput'],
    file,
  );
});

record('library tables and migration exist', () => {
  assertIncludes(
    read('src/main/worker/dbService/tables.ts'),
    ['play_history', 'favorite_songlist', 'favorite_album', "DB_VERSION = '3'"],
    'src/main/worker/dbService/tables.ts',
  );
  assertIncludes(
    read('src/main/worker/dbService/migrate.ts'),
    ['migrateV2', "ensureTable(db, 'play_history')", "case '2'"],
    'src/main/worker/dbService/migrate.ts',
  );
});

record('library ipc contracts are typed', () => {
  const file = 'src/shared/ipc/contracts.ts';
  assertIncludes(
    read(file),
    [
      'libraryHistoryList',
      'libraryHistoryAdd',
      'libraryFavoriteSongListToggle',
      'libraryFavoriteAlbumToggle',
      'libraryCategoryGroups',
      'libraryCategoryItems',
    ],
    file,
  );
});

record('library db service exposes history favorites and categories', () => {
  const file = 'src/main/worker/dbService/modules/library/index.ts';
  assertIncludes(
    read(file),
    [
      'HISTORY_LIMIT = 1000',
      'addPlayHistory',
      'toggleFavoriteSongList',
      'toggleFavoriteAlbum',
      'getLibraryCategoryGroups',
      'getLibraryCategoryItems',
      'getAllUserList',
      'getListMusics',
    ],
    file,
  );
});

record('renderer service and store are wired', () => {
  assertIncludes(
    read('src/renderer-react/services/libraryService.ts'),
    ['toggleFavoriteSong', 'LIST_IDS.LOVE', 'createAlbumFavoriteFromMusic', 'getCategoryGroups'],
    'src/renderer-react/services/libraryService.ts',
  );
  assertIncludes(
    read('src/renderer-react/stores/domains/libraryStore.ts'),
    ['LibraryStore', 'favoriteSongs', 'toggleFavoriteSongListItem', 'loadCategoryGroups'],
    'src/renderer-react/stores/domains/libraryStore.ts',
  );
  assertIncludes(
    read('src/renderer-react/stores/domains/playerStore.ts'),
    ['library?.addPlayHistory', 'this.currentQueueId'],
    'src/renderer-react/stores/domains/playerStore.ts',
  );
});

record('favorites and library routes are visible', () => {
  assertIncludes(
    read('src/renderer-react/app/routeConfig.tsx'),
    ['FavoritesRoutePanel', 'LibraryRoutePanel', "label: '我的收藏'", "label: '音乐分类'"],
    'src/renderer-react/app/routeConfig.tsx',
  );
  assertIncludes(
    read('src/renderer-react/features/favorites/FavoritesRoutePanel.tsx'),
    ['收藏歌曲', '收藏歌单', '收藏专辑', '创建歌单'],
    'src/renderer-react/features/favorites/FavoritesRoutePanel.tsx',
  );
  assertIncludes(
    read('src/renderer-react/components/player/FavoriteSongBtn.tsx'),
    ['FavoriteSongBtn', 'toggleFavoriteSong', '收藏歌曲', '取消收藏歌曲'],
    'src/renderer-react/components/player/FavoriteSongBtn.tsx',
  );
  assertIncludes(
    read('src/renderer-react/features/online/OnlineMusicRowActions.tsx'),
    ['FavoriteSongBtn', 'musicInfo={musicInfo}'],
    'src/renderer-react/features/online/OnlineMusicRowActions.tsx',
  );
  assertIncludes(
    read('src/renderer-react/features/library/LibraryRoutePanel.tsx'),
    ['播放记录', '音乐分类', '按专辑', '按类型', '按歌手', '按年代'],
    'src/renderer-react/features/library/LibraryRoutePanel.tsx',
  );
});

if (failures.length) {
  console.error('\nLibrary capability smoke failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('\nLibrary capability smoke passed.');
