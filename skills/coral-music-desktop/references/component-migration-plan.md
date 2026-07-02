# 珊瑚音乐 Component Migration Plan

This plan tracks the step-by-step migration of the legacy Vue component trees in `src/renderer` and `src/renderer-lyric` into the active React surfaces:

- Main window target: `src/renderer-react`.
- Desktop lyric target: `src/lyric-react`.
- Shared target: `src/shared`.

Current inventory from 2026-06-24 after Step 108 cleanup:

```text
total .vue: 0
legacy src/renderer: removed
legacy src/renderer-lyric: removed
```

## Migration Rules

1. Preserve behavior before deleting Vue source.
2. Do not rename IPC channels or persisted setting keys during component migration.
3. Move state out of components before porting large views:
   - Vue `ref`/`reactive` stores become MobX domain stores.
   - Shared async operations become service modules.
   - UI-only local state stays in React component state.
4. Use Ant Design for ordinary controls, forms, modals, tabs, menus, dropdowns, switches, sliders, color pickers, feedback, and empty/loading states.
5. Keep custom React components for:
   - frameless Electron window chrome and drag regions,
   - virtualized music lists,
   - music row interactions,
   - player transport controls,
   - lyric rendering and timeline behavior,
   - audio visualization and sound effect controls.
6. Every batch must pass:
   - `npm run lint`
   - `npm run build`
   - the closest runtime smoke check listed in that batch.
7. Delete legacy Vue files only after the React replacement is wired, built, and manually smoke-tested.

## Target Directory Shape

```text
src/renderer-react/
  app/
    AppShell.tsx
    providers.tsx
    router.tsx
  components/
    base/
    common/
    layout/
    material/
  features/
    download/
    leaderboard/
    list/
    player/
    search/
    settings/
    song-list/
  services/
    ipc/
    player/
    list/
    search/
    download/
  stores/
    rootStore.ts
    domains/
  styles/

src/lyric-react/
  app/
  components/
    common/
    layout/
  services/
  stores/
  styles/

src/shared/
  brand.ts
  domain/
  ipc/
  theme/
  utils/
```

## Step 0: Build Entry Normalization

Status: started.

Tasks:

- [x] Add root `vite.config.ts`.
- [x] Keep `build-config/vite/*` as the detailed per-surface configs.
- [x] Let root Vite select targets by `CORAL_VITE_TARGET=renderer|lyric|main|preload`.
- [ ] Add a smoke command for root Vite target resolution if needed.

Acceptance:

- `npm run build:renderer` uses root `vite.config.ts`.
- `npm run build:renderer-lyric` uses root `vite.config.ts`.
- `npm run build:main` uses root `vite.config.ts`.
- `npm run build:preload` uses root `vite.config.ts`.

## Step 1: React App Skeleton And Providers

Goal: replace the placeholder React shell with a structure that can host migrated components.

Status on 2026-06-23: completed as a host skeleton. Real route implementations remain placeholders until stores/services are migrated.

Tasks:

- [x] Create `src/renderer-react/app/providers.tsx`.
- [x] Create `src/renderer-react/app/router.tsx` with routes matching legacy hash route names:
  - `/search`
  - `/song-list`
  - `/leaderboard`
  - `/list`
  - `/download`
  - `/setting`
- [x] Create `src/renderer-react/app/AppShell.tsx` with:
  - frameless drag region,
  - sidebar,
  - toolbar,
  - content outlet,
  - player bar slot,
  - global modal host.
- [x] Move current `App.tsx` shell code into this structure.
- [x] Keep the current placeholder pages until stores/services are ready.

Vue source covered later:

- `src/renderer/App.vue`
- `src/renderer/components/layout/View.vue`
- `src/renderer/components/layout/Aside/*`
- `src/renderer/components/layout/Toolbar/*`

Acceptance:

- Main React window still renders.
- Navigation state can switch between all target routes.
- `npm run build:renderer` passes.

## Step 2: IPC And Compatibility Services

Goal: make React code talk to the existing main-process contract without importing legacy Vue utilities.

Status on 2026-06-23: completed for the first React-facing service layer. The active contracts cover settings, env params, theme events, list reads, player commands, downloads, sync, OpenAPI, userApi, and generic data reads/writes. Future feature migrations should extend these contracts instead of importing legacy renderer IPC utilities.

Tasks:

- [x] Create `src/shared/ipc/contracts.ts`.
- [x] Create `src/renderer-react/services/ipc/client.ts`.
- [x] Wrap existing channel names from `src/common/ipcNames.ts`.
- [x] Add service modules:
  - [x] `appService`
  - [x] `dataService`
  - [x] `settingService`
  - [x] `themeService`
  - [x] `listService`
  - [x] `playerService`
  - [x] `downloadService`
  - [x] `syncService`
  - [x] `openApiService`
  - [x] `userApiService`
- [x] Keep `contextIsolation: false` until the bridge is feature-complete.

Vue/source behavior covered:

- `src/renderer/utils/ipc.ts`
- `src/common/rendererIpc.ts`
- renderer calls under `src/renderer/core/useApp/*`

Acceptance:

- React can fetch app settings, env params, and theme through typed service calls.
- No React code imports `@renderer/utils/ipc` from the legacy tree.

## Step 3: MobX Domain Store Foundation

Goal: replace Vue reactive global state with MobX stores before porting large components.

Status on 2026-06-23: in progress. All planned MobX domain store foundations now exist. `SettingsStore` owns app settings/env, while feature stores provide the first React-facing state layer for shell state, feature query state, theme switching, player commands, list/download data, dislike rules, sync state, OpenAPI status, and user API metadata.

Tasks:

- [x] Create `src/renderer-react/stores/domains`.
- Add domain stores in this order:
  1. [x] `SettingsStore`
  2. [x] `ThemeStore`
  3. [x] `UiStore`
  4. [x] `PlayerStore`
  5. [x] `ListStore`
  6. [x] `SearchStore`
  7. [x] `SongListStore`
  8. [x] `LeaderboardStore`
  9. [x] `DownloadStore`
  10. [x] `DislikeStore`
  11. [x] `SyncStore`
  12. [x] `OpenApiStore`
  13. [x] `UserApiStore`
- [x] Add initial store hydration from IPC services for settings/env/theme.
- [x] Add computed values that replace common Vue computed expressions for the current React shell and route placeholders.

Legacy stores covered:

- `src/renderer/store/setting.ts`
- `src/renderer/store/index.ts`
- `src/renderer/store/player/*`
- `src/renderer/store/list/*`
- `src/renderer/store/search/*`
- `src/renderer/store/songList/*`
- `src/renderer/store/leaderboard/*`
- `src/renderer/store/download/*`
- `src/renderer/store/dislikeList/*`
- `src/renderer/store/soundEffect.ts`

Acceptance:

- React shell initializes settings and theme from main process.
- Settings update persists through the old IPC path.
- MobX stores become the only state source used by new React components.

## Step 4: Desktop Lyric Window Migration

Goal: finish the smaller renderer first and validate the two-window protocol.

Status on 2026-06-23: in progress. The React lyric renderer now has typed winLyric IPC contracts, a lyric-window service layer, MobX config/music/lyric state, lyric timeline rendering, controls, resize/move interactions, pause/hover hide behavior, audio visualization, and the remaining useful theme/lang/lyric hook side effects.

Migration order:

1. [x] `src/renderer-lyric/store/*` -> `src/lyric-react/stores`.
2. [x] `src/renderer-lyric/utils/ipc.ts` -> `src/lyric-react/services/ipc.ts`.
3. [x] `src/renderer-lyric/core/mainWindowChannel.ts` -> `src/lyric-react/services/mainWindowChannel.ts`.
4. [x] `src/renderer-lyric/core/lyric.ts` -> `src/lyric-react/services/lyricTimeline.ts`.
5. `src/renderer-lyric/useApp/*` -> React hooks under `src/lyric-react/app`.
   - [x] `useWindowSize.ts` and `components/layout/useDrag.js` -> `src/lyric-react/hooks/useLyricWindowInteraction.ts`
   - [x] `useHoverHide.ts` -> `LyricRootStore.shouldHide` plus main-process mouse enter/leave sync.
   - [x] `usePauseHide.ts` -> `LyricRootStore.isPauseHidden` 200ms delayed pause hide.
   - [x] `useTheme.ts` -> `src/lyric-react/services/lyricEnvironment.ts` plus store theme/color sync.
   - [x] `useCommon.ts` -> `applyLyricLanguage()` from React config hydration/change handling.
   - [x] `useLyric.ts` -> `LyricRootStore.mergeConfig()` and `LyricTimelineService` config sync.
6. Components:
   - [x] `App.vue` -> `lyric-react/app/LyricShell.tsx` shell equivalent in `src/lyric-react/App.tsx`
   - [x] `ControlBar.vue` -> `components/layout/ControlBar.tsx`
   - [x] `Icons.vue` -> icon components or `@ant-design/icons`
   - [x] `LyricHorizontal/index.vue` -> `components/layout/LyricHorizontal.tsx`
   - [x] `LyricVertical/index.vue` -> `components/layout/LyricVertical.tsx`
   - [x] resize handles in `App.vue` -> `components/layout/ResizeHandles.tsx`
   - [x] `AudioVisualizer.vue` -> `components/common/AudioVisualizer.tsx`

Acceptance:

- Desktop lyric window opens.
- Main window init/re-init reconnects the lyric window.
- Lock/unlock, always-on-top, hover-hide, pause-hide, resize, and theme update work.
- Lyrics progress and analyzer visualization update while music plays.

## Step 5: Base Components

Goal: replace low-level Vue primitives with React/Ant Design equivalents.

Status on 2026-06-24: completed and cleaned. Step 46 added the React base component set; Step 65 removed `src/renderer/components/base`.

Migration order:

1. `Btn.vue` -> `components/base/IconButton.tsx` and normal Ant Design `Button` usage.
2. `Input.vue` -> Ant Design `Input` wrapper only where app-specific behavior remains.
3. `Checkbox.vue` -> Ant Design `Checkbox`.
4. `Selection.vue` -> Ant Design `Select`.
5. `SliderBar.vue` -> Ant Design `Slider` or custom player slider when pointer behavior differs.
6. `Tab.vue` -> Ant Design `Tabs` or segmented control.
7. `Popup.vue`, `Menu.vue` -> Ant Design `Dropdown`, `Popover`, `Menu`.
8. `VirtualizedList.vue` -> custom React virtual list.
9. `MusicList.vue` -> React music list wrapper using the custom virtual list.

Acceptance:

- Base components have typed props and no dependency on legacy Vue stores.
- Story-like sample usage exists in one route or development fixture.
- Search/list/music row interactions can consume the React components.

## Step 6: Global Plugins And Feedback

Goal: replace Vue plugins used by many screens.

Status on 2026-06-24: completed and cleaned for active React usage. Step 47 added React i18n/dialog/tips services and icon strategy; Step 65 removed the Vue plugin components and kept only a minimal non-Vue `Dialog` compatibility stub for legacy modules not yet migrated.

Migration order:

1. `plugins/i18n.ts` -> React i18n service/hook.
2. `plugins/Dialog/Dialog.vue` -> Ant Design `Modal` service.
3. `plugins/Tips/Tips.vue` -> Ant Design `message` / `notification` wrapper.
4. `plugins/SvgIcon/SvgIcon.vue` -> React icon registry or direct imports.

Acceptance:

- React pages can call `dialog.confirm`, `tips.success`, and `t()`.
- No new React component imports legacy plugin files.

## Step 7: Layout Components

Goal: rebuild the app shell around migrated stores and base components.

Status on 2026-06-24: completed for AppShell sidebar/toolbar/view shell and partially cleaned. Step 48 added React `WindowControlBtns`, `SearchInput`, and AppShell wiring; Step 65 removed `Aside`, `Toolbar`, and `View.vue`. Legacy layout modals and player/detail Vue files remain until their feature parity steps are fully closed.

Migration order:

1. Sidebar:
   - `Aside/index.vue`
   - `Aside/NavBar.vue`
   - `Aside/ControlBtns.vue`
2. Toolbar:
   - `Toolbar/index.vue`
   - `Toolbar/SearchInput.vue`
   - `Toolbar/ControlBtns.vue`
3. Main view wrapper:
   - `View.vue`
4. Global modals:
   - `PactModal.vue`
   - `UpdateModal.vue`
   - `ChangeLogModal.vue`
   - `SyncModeModal.vue`
   - `SyncAuthCodeModal.vue`

Acceptance:

- Frameless window controls work.
- Route switching and route restore work.
- Modals open from stores/services.
- Existing Electron drag regions are preserved.

## Step 8: Player Bar And Play Detail

Goal: port the highest-risk always-visible UI after stores and base components exist.

Status on 2026-06-24: started. Step 49 added a React `PlayerRuntimeBridge`, removed missing player IPC calls from the React service layer, bound `PlayerStore` to the runtime/status lifecycle, added a focused React runtime typecheck, and replaced the temporary AppShell footer controls with the React `PlayBar`. Step 50 added the first React play-detail overlay shell, connected it to the PlayBar entry point, and reused the player store/runtime status for cover, metadata, progress, lyric text, volume, mode, and playback-rate controls. Step 51 split the runtime types/backend from `playerService` and added the first `HTMLAudioElement` runtime backend for local music files. Step 52 exposed typed React IPC for cached music URLs and taught the runtime to resolve either local file paths or existing cached online URLs. Step 53 added fresh online URL fetching through a dynamically imported SDK boundary and writes successful provider URLs back to cache. Step 54 added completed download-task playback, conservative other-source fallback, and a widened runtime input type. Step 55 added React-owned queue context and explicit previous/next navigation for search, song-list, leaderboard, local-list, and completed-download previews. Step 56 wired audio `ended` auto-advance through the same queue path while preserving play-mode differences between manual and automatic toggles. Step 57 added compact queue position status to PlayBar and PlayDetail. Step 58 added React play-detail window chrome controls and a typed fullscreen IPC service boundary. Step 59 added scoped Play Detail `F11`/`Escape` keyboard behavior through that same boundary. Step 60 added a React lyric menu for font size, alignment, and persisted lyric offset edits. Step 61 added a full lyric selection/copy mode. Step 62 added the first React Play Detail comments panel. Step 63 persisted discovered other-source fallback candidates through the existing main-process cache. Step 64 added conservative React queue skip rules for disliked items, static invalid items, and random-mode played history. External fullscreen-state sync and full worker-equivalent queue filtering are still pending.

Migration order:

1. [x] `components/layout/PlayBar/*` first React shell integrated into `AppShell`
2. [x] `components/common/ProgressBar.vue` first React progress/seek surface
3. [x] `components/common/VolumeBtn.vue` first React volume/mute surface
4. [x] `components/common/PlaybackRateBtn.vue` first React playback-rate surface
5. [x] `components/common/TogglePlayModeBtn.vue` first React play-mode surface
6. [x] `components/layout/PlayDetail/*` first React overlay shell
7. [x] `components/layout/PlayDetail/components/LyricMenu.vue` first React menu for font size, alignment, and offset edits
8. [x] `components/layout/PlayDetail/components/MusicComment/*` first React comments panel

Acceptance:

- Play, pause, prev, next, collect, progress seek, volume, mute, playback rate, and play-mode controls work.
- Local-file play, pause, seek, volume, mute, playback rate, duration, progress, explicit previous/next, audio-ended auto-advance, compact queue position display, conservative disliked/static-invalid item skipping, and random-mode played-history filtering now have a React-owned audio/backend/UI path. Existing cached online URLs, fresh current-source online URLs, conservative other-source fallback URLs, persisted discovered alternate-source candidates, and completed download-task files can also be played by the same backend. Full worker-equivalent filtering still requires follow-up runtime work.
- Play-detail overlay opens/closes and has React-owned fullscreen/minimize/close chrome controls. Scoped `F11`/`Escape` keyboard behavior works while the overlay is open; OS-level fullscreen-change event sync is still pending.
- Lyrics render, update offset through the React lyric menu, and expose full lyric selection/copy mode. Full scroll-sync parity is still pending.
- Play Detail comments can load hot/latest pages through the React online SDK boundary.

## Step 9: Reusable Material Components

Goal: port shared business UI used across search, song list, leaderboard, and list views.

Status on 2026-06-23: started for the online routes. `src/renderer-react/features/online/OnlinePreviewList.tsx` now provides shared `OnlinePager`, `OnlineMusicPreviewList`, and `OnlineSongListPreviewList` components used by Search, Song List, and Leaderboard route panels. `OnlineControls.tsx` provides shared source select, tag cloud, and board selector controls. `OnlineMusicRowActions` provides the first React play/add actions over the existing player/list IPC contracts. These are still lightweight previews; the full `material/OnlineList` action row and download task migration are pending.

Migration order:

1. `material/SearchInput.vue`
2. `material/Modal.vue`
3. `material/Pagination.vue`
   - [x] first React pager surface: `OnlinePager`
4. `material/PopupBtn.vue`
5. `material/ListButtons.vue`
6. `material/SongList.vue`
   - [x] first React hot-tag control surface: `OnlineTagCloud`
7. `material/OnlineList/index.vue` plus:
   - `useList.ts`
   - `useMenu.js`
   - `useMusicActions.js`
     - [x] first React play/add row action surface
   - `useMusicAdd.js`
   - `useMusicDownload.js`
   - `usePlay.ts`

Acceptance:

- Shared list action menus work from at least one React route.
- Pagination and online list item actions match legacy behavior.

## Step 10: Search, Song List, And Leaderboard Routes

Goal: migrate online browsing/search flows before local list mutation flows.

Status on 2026-06-23: service/store wiring and first actionable React panels are in place. `src/renderer-react/services/onlineMusicService.ts` centralizes React access to the legacy online music SDK for search, song-list, and leaderboard data without importing Vue stores/actions. `SearchStore` now has service-backed music and song-list search actions, `SongListStore` has service-backed tag/list/detail loading plus tag/sort metadata state, and `LeaderboardStore` has service-backed board/detail loading. A lightweight `musicSdk/runtimeState.js` adapter keeps the legacy SDK from importing the full Vue renderer store when bundled from React, and `onlineMusicServiceLoader` keeps the larger SDK path behind a dynamic import boundary. `SearchRoutePanel`, `SongListRoutePanel`, and `LeaderboardRoutePanel` now provide route-level controls, shared preview lists, unified pagination, song-list detail preview, and first play/add row actions that exercise those stores before the full Vue list components are replaced.

Migration order:

1. Search:
   - [x] route-level control panel for source/type/query/page
   - [ ] `views/Search/index.vue`
   - `views/Search/MusicList/index.vue`
   - `views/Search/SongListList/index.vue`
   - `views/Search/components/BlankView.vue`
2. Song list:
   - [x] route-level control panel for source/sort/tags/list/detail
   - [ ] `views/songList/List/index.vue`
   - `views/songList/List/ListView.vue`
   - `views/songList/List/components/*`
   - [x] first React detail music preview surface
   - [ ] `views/songList/Detail/index.vue`
3. Leaderboard:
   - [x] route-level control panel for source/board/detail
   - [ ] `views/Leaderboard/index.vue`
   - `views/Leaderboard/BoardList/index.vue`
   - `views/Leaderboard/MusicList/index.vue`

Acceptance:

- Search history, source switching, pagination, play/add/download actions work.
- Song-list category/tag/sort/detail navigation works.
- Leaderboard list and music list load and play.

## Step 11: Local List Routes

Goal: migrate the local list feature after list store parity.

Status on 2026-06-24: started. `ListStore` can now load songs for the selected list through `listService.getListMusics()`, and `LocalListRoutePanel` provides the first React surface for selecting a local list and previewing its songs. User-list create, rename, and delete now go through typed IPC. Local music remove and clear actions are wired. Step 67 renders the full selected list, adds row selection, selected-count state, play-selected queueing, and batch remove. Step 68 adds current-list search/filter and song count status. Step 69 adds copy-selected and move-selected workflows through typed `list_music_move` IPC. Step 70 adds display sorting by name, singer, album, source, and duration over the filtered list. Step 71 adds persistent selected-song reorder through typed `list_music_update_position` IPC with move-to-position, top, and bottom controls. Step 72 adds duplicate detection/removal over the current list using the legacy name normalization rule. Step 73 adds selected-list persistent top/bottom reorder through typed `list_update_position` IPC. Step 74 adds per-row more actions for copy-name and search-by-song. Step 78 adds current-list import/export for `playListPart` and `playListPart_v2` files. Step 79 upgrades duplicate removal into a review modal with retained/copy rows and single/all duplicate-copy removal. Step 80 adds persistent save-current-sort and random-sort actions for the selected list through `list_music_update_position`. Step 81 removed the covered legacy Vue sort modals from `src/renderer/views/List`. Step 82 adds source-toggle candidate search and replace-in-place behavior through typed list IPC. Step 83 removed the covered legacy `MusicToggleModal.vue`. Step 84 removed the covered legacy current-list search Vue component. Drag/reorder and remaining context menu actions are still pending.

Migration order:

1. `views/List/index.vue`
   - [x] first React route panel for selecting a list and previewing songs
2. `views/List/MyList/index.vue`
   - [x] first React user-list create/rename/delete surface
   - [x] first React selected-list persistent top/bottom reorder actions
   - [x] first React import/export current list actions
3. `views/List/MyList/components/*`
4. `views/List/MusicList/index.vue`
   - [x] first React local song preview and play/remove/clear actions
   - [x] first React full-list display, row selection, play selected, and batch remove
   - [x] first React current-list search/filter and count status
   - [x] first React copy-selected and move-selected actions
   - [x] first React display sorting over the filtered current list
   - [x] first React persistent whole-list sort and random sort actions
   - [x] first React persistent selected-song reorder actions
   - [x] first React duplicate detection and batch duplicate removal
   - [x] first React duplicate review modal
   - [x] first React per-row more actions for copy-name and search
   - [x] first React source-toggle candidate search and replace action
5. `views/List/MusicList/components/*`
6. Associated hooks:
   - `useList.js`
   - `useMenu.js`
   - `useMusicActions.js`
   - `useMusicAdd.js`
   - `useMusicDownload.js`
   - `useMusicToggle.js`
   - `usePlay.js`
   - `useSearch.js`
   - `useSort.js`

Acceptance:

- Create/rename/delete/sort lists.
- Add/remove/toggle music between lists.
- Duplicate detection, import/open list, search inside list, and sort modals work.
- Sync event echo prevention remains intact.

## Step 12: Download Route

Goal: migrate persisted download workflow.

Status on 2026-06-24: started. `DownloadRoutePanel` now shows a React task preview with refresh, status, progress, and file path. Task remove and clear actions now go through typed IPC/service/store wiring. Step 75 adds a typed `open_dir_in_explorer` send bridge and per-row more actions for opening the downloaded file location and searching the task music. Step 76 adds task selection, play-selected completed tasks, and batch remove. Download start/pause/update and download modal actions are still pending because they depend on the legacy renderer download worker.

Files:

- `views/Download/index.vue`
  - [x] first React task preview and refresh surface
  - [x] first React remove and clear task actions
  - [x] first React open-file-location and search task actions
  - [x] first React task selection, play selected, and batch remove actions
- `views/Download/useList.js`
- `views/Download/useListInfo.js`
- `views/Download/useMenu.js`
- `views/Download/useMusicAdd.js`
- `views/Download/usePlay.js`
- `views/Download/useTab.js`
- `views/Download/useTaskActions.js`
- `components/common/DownloadModal.vue`
- `components/common/DownloadMultipleModal.vue`

Acceptance:

- Download list loads from DB.
- Start/pause/remove/open actions work.
- Download modal and batch download modal preserve legacy options.

## Step 13: Settings Route

Goal: use Ant Design forms for the largest settings surface.

Status on 2026-06-24: completed and cleaned. Steps 30-45 migrated the Settings Route across common, playback, play-detail, desktop-lyric, list, download, search, update, network, ODC, sync, OpenAPI, User API, backup, hotkey, theme selector/editor, dislike rules, play-timeout, other, and about surfaces. Step 66 removed `src/renderer/views/Setting` and marked the React Settings route as migrated.

Migration order:

1. `SettingBasic.vue`
   - [x] first React common setting controls
2. `SettingPlay.vue`
   - [x] first React playback setting controls
3. `SettingPlayDetail.vue`
   - [x] first React play-detail setting controls
4. `SettingDesktopLyric.vue`
   - [x] first React desktop-lyric setting controls
5. `SettingDownload.vue`
   - [x] first React download setting controls
6. `SettingList.vue`
   - [x] first React list setting controls
7. `SettingSearch.vue`
   - [x] first React search setting controls
8. `SettingNetwork.vue`
   - [x] first React network proxy setting controls
9. `SettingUpdate.vue`
   - [x] first React update setting controls
10. `SettingSync/*`
    - [x] first React sync mode/enable/host/port/max snapshot controls
    - [x] first React server device refresh/remove and auth-code action surface
11. `SettingOpenAPI.vue`
   - [x] first React OpenAPI setting controls
12. `SettingBackup.vue`
    - [x] first React backup import/export surface
13. `SettingHotKey.vue`
    - [x] first React local/global hotkey editor surface
14. `SettingOdc.vue`
    - [x] first React ODC setting controls
15. `UserApiModal.vue`
    - [x] first React read-only User API list preview
    - [x] first React User API remove/update-alert actions
    - [x] first React User API import file / online import / set-current actions
16. `UserApiOnlineImportModal.vue`
    - [x] first React online import modal surface
17. `DislikeListModal.vue`
    - [x] first React dislike rules editor modal surface
18. `ThemeSelectorModal.vue`
    - [x] first React theme selector modal surface
19. `ThemeEditModal/*`
    - [x] first React theme editor modal surface (11 color pickers, background image, dark/preview toggles)
20. `SettingAbout.vue`
    - [x] first React about section surface
21. `SettingOther.vue`
    - [x] first React other settings section surface (transparent window, tray theme, cache cleanup, clear list, dislike entry)
22. `PlayTimeoutModal.vue`
    - [x] first React play timeout modal surface

Acceptance:

- Every persisted setting key writes through the existing setting update path.
- Theme editing and color picker behavior are preserved.
- Hotkey, sync, OpenAPI, backup, and userApi workflows work in Electron.

## Step 14: Sound Effect And Audio Visualization

Goal: migrate specialized audio controls after the player core is stable.

Files:

- `components/common/AudioVisualizer.vue`
- `components/common/SoundEffectBtn/index.vue`
- `components/common/SoundEffectBtn/BiquadFilter.vue`
- `components/common/SoundEffectBtn/AudioConvolution.vue`
- `components/common/SoundEffectBtn/AudioPanner.vue`
- `components/common/SoundEffectBtn/PitchShifter.vue`
- `components/common/SoundEffectBtn/AddEQPresetBtn.vue`
- `components/common/SoundEffectBtn/AddConvolutionPresetBtn.vue`

Acceptance:

- WebAudio graph state remains stable through route changes.
- EQ, convolution, panner, pitch shifter, and presets persist.
- AudioWorklet still loads under Vite and packaged Electron.

## Step 15: Workers, Assets, And Cleanup

Goal: remove legacy Vue sources after parity.

Status on 2026-06-24: completed for Vue and renderer compatibility cleanup. Steps 104-105 removed the remaining Vue SFCs and Vue scaffold. Steps 106-108 moved the React-used music SDK into `src/renderer-react/services/musicSdk`, replaced `window.coral.worker.download.createDownloadTasks` with a React task factory, and deleted the remaining `src/renderer` directory.

Tasks:

- [x] Move reusable non-UI logic from `src/renderer` into `src/renderer-react/services` or `src/shared`.
- [x] Move the full download executor from the legacy worker model into a React/main-process runtime bridge.
- [x] Remove `src/common/utils/vueTools.ts` and `src/common/utils/vueRouter.ts` after no imports remain.
- [x] Remove `src/common/types/shims_vue.d.ts` after no types depend on Vue.
- [x] Delete legacy `.vue` files batch by batch only after React replacements pass runtime smoke tests.
- [x] Remove `src/renderer` and `src/renderer-lyric` directories when all imports are gone.

Acceptance:

- `rg '\.vue|vueTools|vueRouter|shims_vue|@renderer/|@lyric/' src package.json build-config vite.config.ts` has no legacy hits except documented migration notes.
- `npm run lint` passes.
- `npm run build` passes.
- Packaged smoke test starts main and lyric windows.

## Current Next Batch

Recommended next implementation batch:

1. Step 110 completed the first download runtime bridge: manual start, pause, retry, URL refresh request, progress events, save path checks, and download DB persistence now run through typed IPC.
2. Step 111 completed React-side queue scheduling around `download.maxDownloadNum`, automatic queued-task pickup after slot release, bounded URL refresh retry, and cached lyric sidecar export on completion.
3. Step 112 completed download lyric cache prefetch, embedded MP3/FLAC metadata writing, sidecar lyric export, and completed-file existence/size verification.
4. Step 113 removed the remaining React-side Vue compatibility shim and confirmed project package metadata no longer carries direct Vue/Webpack dependencies; lockfile only has a transitive funding URL mentioning webpack.
5. Step 114 stabilized the renderer dev startup path after Electron reached the main window: React-side imports of `@common/utils/nodejs` were replaced with a renderer `nodeBridgeService`, music SDK crypto/zlib helpers now use runtime `globalThis.require`, and `npm run dev` no longer reproduces the `node:zlib.gzip` browser-externalized crash during the startup smoke window.
6. Step 115 added a repeatable download runtime smoke command and fixed DB worker async reads in the main-process download runtime. `npm run smoke:download` now starts Electron dev mode, serves a local fixture file, verifies start/progress/pause/retry/completion, verifies failed URL recovery status, and verifies sidecar lyric output without touching the user's real download directory.
7. Step 116 added `npm run smoke:migration`, a no-new-dependency migration smoke that verifies React route wiring, online/search/song-list/leaderboard service surfaces, MobX feature panel wiring, typed download IPC/runtime/store wiring, download smoke command availability, no Vue SFCs, and no React/lyric references to the deleted renderer bridge.
8. Step 117 removed the renderer build's Node builtin externalization warnings by moving `electron`, `needle`, `tunnel`, `zlib`, and `electron-log/node` usage behind runtime `globalThis.require` or lazy wrappers. Renderer build now only reports the known music SDK dynamic/static import warning and chunk-size warnings.
9. Step 118 completed the first package polish audit: Electron builder identity now uses Coral Music names and app id, old upstream publish defaults were removed in favor of explicit `CORAL_PUBLISH_OWNER` / `CORAL_PUBLISH_REPO`, and `npm run smoke:package` now verifies package identity, builder identity, resources, publish guardrails, and retained deep-link compatibility.
10. Step 119 completed a release-readiness audit pass: user-facing upstream links are centralized in `coralProjectLinks`, Settings labels now make upstream links explicit, runtime title/tray fallbacks use the Coral brand, package author metadata uses `Coral Music Team`, and `npm run smoke:release` composes migration smoke, package audit, and React typecheck. `npm run pack:dir` reached Electron runtime download after Vite build/native rebuild, but the network download produced an incomplete zip and was interrupted.
11. Step 120 scoped the optional UI/Electron click-through automation track and deferred it until local Electron runtime downloads/cache are stable; current coverage remains `smoke:migration`, `smoke:download`, `smoke:package`, and `smoke:release`.
12. Step 121 removed deprecated Ant Design `List` usage from migrated React panels by adding `PlainList`, `PlainListItem`, and `PlainListMeta`, replacing all `List/List.Item/List.Item.Meta` call sites, and adding a migration smoke guard against reintroduction.
13. Step 122 resolved the music SDK static/dynamic import warning by moving `onlineMusicService` and `musicDetailService` behind cached dynamic SDK loading. Renderer build now emits a separate `sdk-*.js` chunk around 222 KB and the main renderer chunk is about 1.305 MB. `smoke:migration` now guards against static SDK imports in React services.
14. Step 123 completed route-level code splitting: the six main route panels now load via `React.lazy`, RouterOutlet uses Suspense fallback, migration smoke expects dynamic route imports, and the main renderer entry is about 316 KB with route panels emitted as separate chunks. The remaining renderer chunk warning is now concentrated in shared `base-*.js`.
15. Step 124 added renderer manual chunk rules for React, MobX, vendor, icons, rc/AntD internals, and Ant Design component modules. Renderer build no longer emits chunk-size warnings; entry is about 118 KB and the largest renderer chunk is about 377 KB. The remaining full-build chunk warning is now isolated to the lyric renderer.
16. Step 125 added lyric renderer manual chunk rules for React, MobX, Ant Design, icons, rc dependencies, generic vendor, and the lyric font player. Lyric main chunk dropped from about 603 KB to about 31 KB, largest lyric chunk is about 346 KB, and full `npm run build` no longer emits chunk-size warnings.
17. Step 126 attempted to continue packaged-app readiness with a clean Electron cache path, but the required escalated/network `pack:dir` run was rejected by the environment usage limit before execution. Packaged `dir` verification remains pending; latest non-packaging gates are still green.
18. Step 127 added `npm run smoke:bundle` and included it in `smoke:release`, guarding renderer/lyric manual chunk strategy, route-level lazy imports, and the absence of `chunkSizeWarningLimit` threshold masking.
19. Step 128 added `npm run smoke:dist` and `npm run smoke:full`. Dist smoke validates required build outputs, route chunks, vendor chunks, browser chunk ceilings under 500 KiB, and bounded preload/worker outputs. `smoke:full` is now the strongest no-network gate: build, lint, release smoke, and dist smoke.
20. Step 129 documented the no-network validation flow and packaged `pack:dir` retry path in `README.md`, including the clean-cache Electron runtime command `ELECTRON_CACHE=/private/tmp/coral-electron-cache npm run pack:dir`.
21. Step 130 guarded release metadata placeholders: README no longer shows upstream LX release/build badges as Coral status, package repository/bugs/homepage stay empty until the real Coral repository is known, and package audit verifies these placeholders do not silently point to upstream.
22. Step 131 added the playback capability contract for local audio, Foobar2000-style external decoder adapters, and Coral Music User API source plugins. The project now has shared playback capability constants, AppSetting/default-setting keys for native local formats and explicit external decoder configuration, a dedicated playback capability plan, and `npm run smoke:playback-capabilities` included in release smoke.
23. Step 132 started local audio import: React now has a local-audio service that scans selected files/directories, filters native/external-decoder candidate extensions, creates `MusicInfoLocal` records, and adds them to the selected list through the migrated list IPC/store path. Metadata tag parsing and decoder-backed playback remain in the next batches.
24. Step 133 added local metadata scanning during import through the existing `music-metadata` dependency, loaded lazily at runtime to avoid renderer bundle Node builtin regressions. Imported local files now prefer tag title/artist/album/duration and fall back to filename inference when metadata cannot be read.
25. Step 134 added a typed, non-executing external decoder probe boundary. React can now call `externalDecoderService.probeExternalDecoder`, which reaches the main process through typed IPC and validates Foobar2000 executable/plugin paths, supported extension declarations, and platform warnings without loading plugins or running a transcode.
26. Step 135 exposed the external decoder configuration in Settings. The React settings route now supports local audio enablement, decoder provider/output/timeout settings, Foobar2000 executable selection, component directory selection, extension normalization, and manual probe status display through the non-executing Step 134 IPC boundary.
27. Step 136 shifted back to feature usability: fixed the Local List white-screen crash caused by drag-mode handlers being scoped inside the shuffle handler, aligned main-window min/max/close IPC with the React invoke client, and added top-level quick entries for opening local audio files and adding User API sources. Local audio import now creates or selects a target list instead of silently doing nothing when no list is selected.
28. Step 137 restored core usability around playback and layout: the React music SDK runtime now initializes the selected User API source and proxies `musicUrl` requests through typed main-process IPC, imported User API sources become current automatically, missing-source playback failures show an actionable add-source message, and the app shell/content layout now gives Settings a real scroll container.
29. Step 138 made playback/source failures visible in the UI: the runtime now publishes `errorText`, the player store derives missing-source state, PlayBar and Play Detail show actionable add-source controls, and Settings displays the current User API source status plus supported music platforms.
30. Step 139 added User API playback validation. Settings now treats only APIs that declare at least one music `musicUrl` platform as playable, blocks non-playable APIs from becoming the current playback source, warns after importing unusable scripts, and falls back only to playable APIs when deleting the current source.
31. Step 140 added the first external decoder runtime path. Local playback now separates native browser-playable files from external-decoder formats, routes DSD/SACD-style extensions through typed main-process IPC, and can use FFmpeg to transcode external formats into temporary WAV files before handing them to the existing HTML audio runtime. Foobar2000 remains available for path/probe configuration but intentionally reports a clear runtime error until a reliable non-interactive converter contract is added.
32. Step 141 expanded `smoke:playback-capabilities` from static capability declarations into focused feature guards for the current local playback path, external decoder transcode IPC, User API playable-source validation, and top-level local/source quick entries.
33. Step 142 tightened the external decoder runtime ergonomics: decoded temporary WAV files are cleaned up on track changes, dispose, or stale requests, Settings explains the FFmpeg-vs-Foobar runtime status, and FFmpeg can be resolved from `PATH` by using the default `ffmpeg` command instead of forcing a file picker path.
34. Step 143 improved decoder failure guidance and settings guardrails. Missing FFmpeg and permission failures now produce actionable Chinese player errors, FFmpeg output is forced back to WAV when enabled, and the PCM option is disabled until the runtime can hand raw PCM to the player.
35. Step 144 improved visible recovery paths: player errors related to FFmpeg or external decoding now show a `配置解码器` action that opens Settings and scrolls to the local decoder section, and the local list empty state now offers direct `导入本地音频` and `新建列表` actions.
36. Step 145 polished local playback empty/error states. Empty local lists now create/select a `本地音乐` list through a dedicated action, local import remains clickable but warns and jumps to local decoder settings when the capability is disabled, and the playback capability smoke guards these recovery flows.
37. Step 146 fixed local FLAC playback without requiring online sources or external FFmpeg configuration. The player temporarily probed `Audio.canPlayType()` before treating a local extension as browser-native, and local/downloaded FLAC fell back to an in-memory WAV Blob URL for the existing audio runtime.
38. Step 147 switched the internal local decoder path from the dedicated FLAC dependency to `audio-decode`, expanding decode support to MP3, WAV, OGG/OGA Vorbis, FLAC, Opus, M4A/AAC/ALAC, QOA, AIFF, CAF, WebM, AMR, and WMA. The follow-up implementation removed direct Electron local-file playback entirely: local/downloaded files and external-decoder WAV outputs now all flow through `audio-decode`.
39. Step 148 implemented JustDSD as a real zero-config external decoder provider. JustDSD is enabled by default for external formats; Java and `jdsd-nodep.jar` settings are optional advanced overrides, while packaged builds auto-resolve bundled assets from `resources/justdsd`. The runtime invokes a packaged Coral Java source-file helper with JustDSD on the classpath to export DSF/DFF/SACD to temporary WAV, and playback then decodes that WAV through the same `audio-decode` AudioBuffer path.
40. Step 149 completed the local-import and zero-configuration decoder UX pass. Windows import now uses an All Files picker and delegates supported-format filtering to `localAudioService`; global file/folder drag/drop imports into the fixed `本地音乐` list; ordinary Settings no longer exposes external-decoder toggles/output/timeout/extensions/probe controls; stale external-decoder settings no longer disable DSF/DFF import or playback.

Recommended next implementation batch:

1. Step 150: revisit UI/Electron click-through automation once the packaging/runtime environment is less noisy.
2. Step 151: run a focused visual pass on Settings/List/PlayBar when a stable app window is available.
3. Step 152: when the real Coral Music repository is known, set `repository.url`, `bugs.url`, `homepage`, README badges, and publish owner/repo workflow docs together.

This order keeps the app startable first, then expands local playback and source-plugin capability behind typed, smoke-guarded runtime boundaries before returning to release metadata polish.
