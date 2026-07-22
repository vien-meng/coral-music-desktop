const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const modules = read('src/main/modules/index.ts');
const sync = read('src/main/modules/sync/index.ts');
const protocol = read('src/common/constants_sync.ts');
const settings = read('src/renderer-react/features/settings/SettingsRoutePanel.tsx');
const openApi = read('src/main/modules/openApi/runtime.ts');
const shell = read('src/renderer-react/app/AppShell.tsx');
const listStore = read('src/renderer-react/stores/domains/listStore.ts');
const songListPanel = read('src/renderer-react/features/song-list/SongListRoutePanel.tsx');
const songListStore = read('src/renderer-react/stores/domains/songListStore.ts');

assert.match(modules, /registerSync\(\)/, 'sync runtime must be registered');
assert.match(protocol, /authMsg: 'lx-music auth::'/, 'LX auth marker must remain compatible');
assert.match(protocol, /msgConnect: 'lx-music connect'/, 'LX socket marker must remain compatible');
assert.match(sync, /app_inited/, 'saved sync configuration must be restored at startup');
assert.match(sync, /updated_config/, 'sync disable must stop the running service');
assert.match(
  settings,
  /Input\.Password/,
  'client pairing code must be an ephemeral password input',
);
assert.match(settings, /handleOpenApiConfig/, 'OpenAPI settings must call the runtime action');
assert.match(
  settings,
  /defaultValue=\{appSetting\['sync\.server\.port'\]\}/,
  'Sync server port must remain editable',
);
assert.match(
  settings,
  /defaultValue=\{appSetting\['sync\.client\.host'\]\}/,
  'Sync client address must remain editable',
);
assert.match(openApi, /app_inited/, 'OpenAPI settings must be restored at startup');
assert.match(
  shell,
  /SyncConflictModal/,
  'first-sync conflict selection must be globally available',
);
assert.match(
  listStore,
  /mirrorOnlineFavoriteSongList/,
  'online favorite songlists must be mirrored into syncable local lists',
);
assert.match(
  songListPanel,
  /await songList\.getAllListDetailMusics\(\)/,
  'collecting an online songlist must include its songs in the mirror',
);
assert.match(
  songListStore,
  /async getAllListDetailMusics\(\)/,
  'all pages of an online songlist must be collected before syncing',
);

console.log('settings and LX sync smoke checks passed');
