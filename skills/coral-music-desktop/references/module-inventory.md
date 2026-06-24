# 珊瑚音乐 Module Inventory

## Root And Build

- `package.json`: scripts for dev, build, pack, publish, lint; current stack dependencies.
- `build-config/runner-dev.js`: starts Vite renderer and lyric dev servers, watches Vite main/preload builds, spawns Electron.
- `build-config/pack.js`: production Vite build for `main`, `dbService.worker`, `renderer-react`, `lyric-react`, and `user-api-preload`.
- `build-config/vite/`: active Vite configs and aliases for Electron main/preload plus the two React renderers.
- `build-config/build-pack.js`: `electron-builder` configuration, targets, artifact naming, native files, app protocol, icons, and licenses.
- `publish/`: release metadata and publishing helpers.
- `resources/`, `licenses/`, `src/static/`: packaged assets for icons, tray/taskbar buttons, and licenses.

## Shared Common Layer

- `src/common/constants.ts`: store names, list IDs, data keys, quality list, download statuses.
- `src/common/defaultSetting.ts`: complete app setting defaults for common UI, player, desktop lyric, list, download, search, network, tray, sync, openAPI, theme, and ODC.
- `src/common/config.ts`: window sizes and navigation allow-list.
- `src/common/hotKey.ts` and `defaultHotKey.ts`: hotkey action definitions and defaults.
- `src/common/ipcNames.ts`: all IPC channel names, grouped by common, player/list, dislike, winMain, winLyric, and hotKey.
- `src/common/mainIpc.ts` and `rendererIpc.ts`: thin typed overload wrappers around Electron IPC.
- `src/common/theme/`: built-in theme JSON, images, color utilities, and theme generation.
- `src/common/types/`: global `LX.*` domain types for settings, music, lists, download, sync, openAPI, userApi, player, theme, IPC, and desktop lyric.
- `src/common/utils/`: shared utilities, request clients, Electron helpers, migration helpers, lyric utilities, pinyin, music metadata, and Vue helpers.

## Main Process

- `src/main/index.ts`: app entry and boot sequencing.
- `src/main/app.ts`: global state setup, single instance, env flags, data path, deeplink, app event listeners, setting/hotkey/DB/theme initialization, and quit behavior.
- `src/main/event/AppEvent.ts`: app-wide typed EventEmitter methods for config, theme, deeplink, player status, hotkeys, and window lifecycle.
- `src/main/event/ListEvent.ts`: list mutations; writes through DB worker and emits local/sync events.
- `src/main/event/DislikeEvent.ts`: dislike rule mutations; writes through DB worker and emits local/sync events.
- `src/main/utils/`: setting merge/persist, hotkey persistence, theme resolution, proxy parsing, power save blocker, logging, migrations, store wrapper, request/font utilities.

## Main Modules

- `src/main/modules/winMain/`: main BrowserWindow lifecycle, window controls, taskbar buttons, progress bar, proxy, update handling, and renderer IPC.
- `src/main/modules/winMain/rendererEvent/app.ts`: app/window commands, dialogs, cache, devtools, player status, themes.
- `src/main/modules/winMain/rendererEvent/data.ts`: generic `electron-store` data get/save for view state, search history, play info, etc.
- `src/main/modules/winMain/rendererEvent/download.ts`: download list DB actions.
- `src/main/modules/winMain/rendererEvent/hotKey.ts`: fetch/send hotkey config and key-down events.
- `src/main/modules/winMain/rendererEvent/music.ts`: lyric cache, edited lyric, music URL cache, and other-source cache DB actions.
- `src/main/modules/winMain/rendererEvent/userApi.ts`: import/remove/select custom source API and proxy requests to the userApi module.
- `src/main/modules/winMain/rendererEvent/sync.ts`: start/stop sync server/client and device management.
- `src/main/modules/winMain/rendererEvent/openAPI.ts`: start/stop/query OpenAPI HTTP server.
- `src/main/modules/winMain/rendererEvent/soundEffect.ts`: EQ/convolution preset persistence.
- `src/main/modules/winLyric/`: desktop lyric BrowserWindow, config projection, resize bounds, lock/mouse/always-on-top behavior, and lyric IPC.
- `src/main/modules/commonRenderers/`: common IPC used by both main renderer and lyric renderer: settings/env/theme plus list and dislike event registration.
- `src/main/modules/hotKey/`: global/local hotkey registration, unregistration, renderer event handling.
- `src/main/modules/tray.ts`: tray icon, tray menu, play controls, desktop lyric toggles, status bar lyric integration.
- `src/main/modules/appMenu.ts`: native menu registration.
- `src/main/modules/openApi/`: local HTTP/SSE API for status, lyric, playback controls, seek, collect, volume, mute, and player-status subscription.
- `src/main/modules/sync/`: server/client sync for list and dislike data, auth, encryption/compression helpers, migration, logs, device management.
- `src/main/modules/userApi/`: imports, stores, runs, and communicates with custom source scripts in an isolated hidden BrowserWindow and preload.

## Main DB Worker

- `src/main/worker/index.ts`: exposes `dbService`.
- `src/main/worker/utils/`: Comlink worker-thread bridge.
- `src/main/worker/dbService/db.ts`: opens/creates `lx.data.db`, uses native `better_sqlite3.node`, runs migrations and verification.
- `src/main/worker/dbService/tables.ts`: schema version `2`; tables for db info, lists, list music/order, other source, lyric, music URL, download list, dislike list.
- `modules/list`: user lists and list music CRUD, ordering, overwrite, existence checks; keeps in-memory list caches.
- `modules/lyric`: raw/edited lyric get/save/remove/count, stores text as base64.
- `modules/music_url`: music URL cache get/save/remove/count.
- `modules/music_other_source`: alternate source cache.
- `modules/download`: persisted download task list.
- `modules/dislike_list`: dislike rules persistence.

## Main Renderer App

- `src/renderer-react/main.tsx`: active React renderer bootstrap.
- `src/renderer-react/App.tsx`: Ant Design shell and migration status surface.
- `src/renderer-react/stores/`: MobX root/settings store seed for the React migration.
- `src/shared/`: shared brand and Ant Design theme token helpers.

## Legacy Main Renderer Reference

- `src/renderer/main.ts`: Vue app bootstrap, settings/language init, router, plugins, workers, global components.
- `src/renderer/App.vue`: main shell layout and global modal composition.
- `src/renderer/router.ts`: hash routes for search, song list, leaderboard, local list, download, and settings.
- `src/renderer/core/globalData.ts`: creates `window.lx`, `window.lxData`, renderer workers, and compatibility globals.
- `src/renderer/event/`: renderer-side app/key events.
- `src/renderer/plugins/`: i18n, SVG icons, dialogs, tips, and player/audio plugin.

## Renderer Core

- `core/useApp/`: renderer boot orchestration.
  - `useDataInit`: initializes userApi, music SDK, lists, dislike data, and previous play info.
  - `usePlayer/`: audio setup, player events, media device, progress, lyric, volume, playback rate, sound effects, preloading, media session.
  - `useSync`, `useOpenAPI`, `useStatusbarLyric`, `useUpdate`, `useSettingSync`, `useDeeplink`, `useHandleEnvParams`, `useEventListener`: app feature initializers.
- `core/player/`: playback business logic: queue navigation, play/pause/stop, URL resolution, retry/auto-skip, random history, collect/dislike, timeout stop.
- `core/music/`: resolves URLs, covers, and lyrics for online, downloaded, and local music; handles source fallback and cache persistence.
- `core/dislikeList.ts`, `core/lyric.ts`, `core/apiSource.ts`: dislike logic, lyric processing, API source initialization.

## Renderer Stores

- `store/setting.ts`: reactive app settings and setting update helpers.
- `store/index.ts`: global reactive state for API source, proxy, sync, OpenAPI, themes, update modal, userApi, fullscreen, quality list.
- `store/list/`: list state and actions; delegates persistence to IPC and updates renderer cache through listManage.
- `store/list/listManage/`: local list cache, action handlers, IPC event registration.
- `store/player/`: current music info, play status, play queues, lyric/progress/volume/playback rate state and actions.
- `store/download/`: download task list state and utilities.
- `store/search/`, `store/search/music/`, `store/search/songlist/`: search text, history, results and online song-list state.
- `store/songList/`: online playlist category/detail state and actions.
- `store/leaderboard/`: leaderboard state and actions.
- `store/dislikeList/`: dislike state/actions.
- `store/soundEffect.ts`, `hotSearch.ts`, `utils.ts`: audio effects, hot search, source support helpers.

## Renderer UI

- `components/base/`: reusable UI primitives such as button, input, checkbox, selection, menu, popup, tabs, sliders, virtualized list, and base music list.
- `components/common/`: player controls, volume, progress, playback rate, download/list modals, audio visualizer, sound effect controls.
- `components/layout/`: aside/nav, toolbar, routed view shell, player bar, play detail overlay, changelog/update/pact/sync modals.
- `components/material/`: online list, pagination, popup button, search input, song list cards.
- `views/Search/`: music and song-list search UI.
- `views/songList/`: online song-list category browsing and detail.
- `views/Leaderboard/`: ranking list and music list.
- `views/List/`: local/user list management, music list operations, duplicate/sort/update/share workflows.
- `views/Download/`: download task list, tabs, menus, add/play/task actions.
- `views/Setting/`: settings pages for basic, play, play detail, desktop lyric, download, list, search, network, update, sync, openAPI, backup, userApi, dislike, theme editing, about.

## Renderer Workers

- `src/renderer/worker/index.ts`: creates main and download Comlink workers.
- `worker/main/`: common/list/music helper operations.
- `worker/download/`: download processing, lrc tools, download utilities.
- `worker/utils/`: Comlink wrapping and callback proxy helper.

## Desktop Lyric Renderer

- `src/lyric-react/main.tsx`: active React desktop lyric bootstrap.
- `src/lyric-react/App.tsx`: Ant Design-backed lyric shell seed.
- `src/lyric-react/stores/`: MobX lyric store seed.

## Legacy Desktop Lyric Renderer Reference

- `src/renderer-lyric/main.ts`: separate Vue bootstrap for desktop lyric window.
- `App.vue`: desktop lyric shell, control bar, vertical/horizontal lyric display, visualizer, resize handles.
- `core/mainWindowChannel.ts`: direct MessageChannel bridge to main window renderer.
- `core/lyric.ts`: lyric playback/rendering timeline.
- `store/state.ts`, `store/action.ts`, `store/lyric.ts`: desktop lyric settings, music info, play status, lyric state.
- `useApp/`: language, hover-hide, pause-hide, lyric behavior, theme, window sizing.
- `utils/ipc.ts`: lyric window IPC calls/events.
- `components/layout/`: control bar, icons, vertical and horizontal lyric renderers.

## Language And Documentation

- `src/lang/`: JSON messages for `zh-cn`, `zh-tw`, `en-us`; custom Vue i18n helper.
- `README.md`, `FAQ.md`, `CHANGELOG.md`, `doc/images/`: user-facing docs and images.
