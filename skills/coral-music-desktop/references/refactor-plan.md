# 珊瑚音乐 Refactor Plan: Electron + React + MobX + Vite + TypeScript + Ant Design

## Project Identity

- Product name: 珊瑚音乐.
- Package/project path: `coral-music-desktop` at `~/Desktop/working/vien_job/coral-music-desktop`.
- Base codebase: copied from `lx-music-desktop` and migrated incrementally.
- Frontend component library: Ant Design (`antd`) using the official LLMs documentation at `https://ant.design/docs/react/llms-cn/`.

## Target Architecture

Keep Electron, the two-window model, workers, SQLite persistence, and release packaging, but move the UI/build/state layers to:

- Vite multi-entry build for main window, desktop lyric window, preload scripts, Electron main, and workers.
- React + React Router for the main renderer and desktop lyric renderer.
- Ant Design (`antd`) as the primary React component library for common UI controls, forms, modals, menus, tables/lists, tabs, layout primitives, feedback, and theme tokens.
- MobX root store for app state, split by domain.
- TypeScript-first source with gradual removal of `allowJs`.
- Typed IPC contracts and preload bridges as the boundary between Electron and React.

Suggested target shape:

```text
src/
  main/                  Electron main process and services
  preload/
    main.ts              main-window bridge
    lyric.ts             desktop-lyric bridge
    user-api.ts          custom source bridge
  renderer-react/
    main.tsx
    app/
    routes/
    components/
    stores/
  lyric-react/
    main.tsx
    components/
    stores/
  shared/
    ipc/
    domain/
    utils/
```

Keep the existing paths during early phases if that reduces churn; the target shape is a direction, not a first commit requirement.

## Migration Principles

- Preserve behavior first, modernize structure second.
- Keep DB schema and IPC channel names stable until the React UI is functional.
- Introduce typed adapters before deleting old globals.
- Migrate by runtime surface: build/IPC, store/domain, main renderer UI, desktop lyric UI, cleanup.
- Prefer Ant Design components before writing custom UI primitives; keep custom components only where Coral Music has specialized behavior such as music rows, virtualized music lists, player controls, lyric rendering, audio visualization, and Electron window chrome.
- Run both old and new code only where it buys safety; avoid long-term dual sources of truth.

## Ant Design Component Strategy

Use Ant Design as the default React UI kit for the migration.

- Official AI documentation entry: `https://ant.design/docs/react/llms-cn/`.
- Before implementing Ant Design-heavy screens, consult the official LLMs resources from that page:
  - `https://ant.design/llms.txt` for navigation links.
  - `https://ant.design/llms-full-cn.txt` for full Chinese component documentation.
  - `https://ant.design/llms-semantic-cn.md` for component semantics and usage patterns.
  - Component Markdown docs by appending `.md` or `-cn.md` to component URLs when a specific component is involved, for example `https://ant.design/components/button-cn.md`.
- Use Ant Design theme tokens and `ConfigProvider` to map the current Coral theme system into React instead of scattering hard-coded colors.
- Use Ant Design controls for settings pages: `Form`, `Input`, `Select`, `Switch`, `Radio`, `Slider`, `InputNumber`, `Tabs`, `Modal`, `Drawer`, `Tooltip`, `Popconfirm`, `Upload`, `ColorPicker`, and feedback components.
- Use Ant Design layout/data components where appropriate, but keep high-performance music lists on a dedicated virtualized implementation if Ant Design `List` or `Table` cannot meet the current behavior/performance.
- Keep desktop lyric UI mostly custom. Ant Design may be useful for the unlocked control bar or settings-style overlays, but lyric text layout, drag/resize, hover-hide, pause-hide, and visualization should remain domain-specific.
- Add `antd` and `@ant-design/icons` during the React dependency phase, then verify bundle size, dark/light theme behavior, Electron focus/drag regions, and CSS reset interactions.

## Phase 0: Baseline And Safety Net

1. Record current successful commands: `npm run lint`, `npm run build`, and a dev smoke test with main window + desktop lyric.
2. Capture runtime behaviors to preserve:
   - App startup and previous route restoration.
   - Settings persistence and theme switching.
   - Search, play, pause, next/prev, collect, dislike.
   - List CRUD and sync broadcasts.
   - Download list persistence.
   - Desktop lyric connect/update/lock/resize.
   - User API import/select/request/cancel.
   - OpenAPI HTTP controls and SSE player status.
3. Freeze the DB schema for the first migration.
4. Add a simple IPC smoke harness or typed compile checks before changing IPC wrappers.

## Phase 1: Vite Build Skeleton

Goal: replace Webpack without changing UI behavior.

Status on 2026-06-22: active project config has been hard-switched to Vite and React shell entries. Webpack and Vue dependencies, scripts, loader configs, and active aliases were removed. Legacy Vue source directories remain as migration references; full feature parity still requires the later React/MobX/IPC phases.

1. Add Vite configuration for these outputs:
   - Electron main -> `dist/main.js`.
   - Main renderer -> `dist/index.html` and bundled assets.
   - Desktop lyric renderer -> `dist/lyric.html`.
   - User API preload -> `dist/user-api-preload.js`.
   - Renderer workers and main DB worker.
2. Preserve aliases: `@root`, `@main`, `@renderer`, `@lyric`, `@static`, `@common`.
3. Preserve static output expectations for tray/taskbar/theme assets.
4. Verify Vite handling for:
   - `new Worker(new URL(..., import.meta.url))` in renderer and main worker code.
   - AudioWorklet loading in `plugins/player/pitch-shifter/phase-vocoder.js`.
   - Native `.node` externals and `better-sqlite3` binding path.
   - Less, SVG sprites/icons, images, media, fonts.
5. Keep Webpack scripts until Vite dev/build proves equivalent.

Implementation note: if React is not introduced in this phase, Vite may temporarily need Vue support. If the team wants a hard switch, create React entries in parallel and leave the old Webpack build as the fallback until parity is reached.

## Phase 2: Typed IPC And Preload Boundary

Goal: make Electron boundaries explicit before React rewrites.

1. Create `src/shared/ipc/contracts.ts` with channel, request, response, and event payload types.
2. Wrap current `ipcNames.ts` strings instead of renaming channels.
3. Add preload bridges:
   - `window.coralBridge.app`
   - `window.coralBridge.player`
   - `window.coralBridge.list`
   - `window.coralBridge.dislike`
   - `window.coralBridge.sync`
   - `window.coralBridge.openAPI`
   - `window.coralBridge.userApi`
   - `window.coralBridge.lyric`
4. Keep `rendererIpc.ts` as a compatibility adapter that delegates to the bridge.
5. Only after adapters are complete, plan `contextIsolation: true` for main and lyric windows.

Do not flip `contextIsolation` as an early step. Current renderer code imports Electron IPC directly and relies on Node-enabled globals.

## Phase 3: MobX Domain Stores

Goal: replace Vue reactive stores with explicit observable stores.

Recommended MobX store modules:

- `SettingsStore`: app settings, derived flags, update/persist actions.
- `ThemeStore`: current theme, user themes, dark mode.
- `PlayerStore`: current music, play status, progress, queue, played list, temp play list, lyric state, sound effects.
- `ListStore`: default/love/temp/user lists, list music cache, list mutations.
- `SearchStore`: search text, history, music/song-list results.
- `SongListStore`: online playlist categories, tags, list detail.
- `DownloadStore`: download tasks and actions.
- `DislikeStore`: dislike rules and remote action registration.
- `SyncStore`: server/client status, auth modal state, device list.
- `OpenAPIStore`: enable/status/address/message.
- `UserApiStore`: custom API list/status/apis/update alerts.
- `UiStore`: route restore, modals, fullscreen, changelog/update/pact state.

Migration order:

1. Port setting and global UI state first.
2. Port list store and listManage next; keep IPC action names.
3. Port player store and core player logic.
4. Port search/songList/leaderboard/download/dislike.
5. Port sync/openAPI/userApi stores.

Keep domain services separate from stores:

- `musicService`: URL/pic/lyric resolution.
- `playerService`: audio plugin orchestration.
- `listService`: IPC calls and local cache updates.
- `downloadService`: worker coordination.
- `syncService`, `openApiService`, `userApiService`.

## Phase 4: React Main Renderer

Goal: rebuild the main UI on React while reusing services and MobX stores.

Detailed component-by-component migration batches live in `references/component-migration-plan.md`.

Suggested order:

1. Install and configure Ant Design, `@ant-design/icons`, `ConfigProvider`, theme tokens, locale, and CSS reset strategy.
2. App shell: aside, toolbar, routed view container, player bar, global modals.
3. Shared UI primitives: map existing base controls to Ant Design wrappers first; keep custom wrappers for Electron drag regions, icon-only controls, virtualized list, music list, and player-specific controls.
4. Player bar and play detail overlay.
5. Search route.
6. Song-list route.
7. Leaderboard route.
8. Local list route and list-management modals.
9. Download route.
10. Settings route and theme editor.

Treat `components/material/OnlineList` and list music interactions as reusable React components because they are used across search, song-list, leaderboard, and local list workflows.

## Phase 5: React Desktop Lyric Renderer

Goal: migrate the second renderer without changing the main-window lyric protocol.

1. Keep `MessageChannelMain` event payloads stable.
2. Port lyric store and lyric timeline/player logic.
3. Port horizontal and vertical lyric components.
4. Port control bar, resize handles, hover-hide, pause-hide, theme, and audio visualization.
5. Verify connect/reconnect when main window initializes after lyric window.

## Phase 6: Workers And Native Packaging

Goal: make Vite-built workers and packaged native dependencies reliable.

1. Validate renderer main/download workers under dev and packaged builds.
2. Validate main DB worker with `better-sqlite3` native binding in dev and packaged builds.
3. Validate `qrc_decode.node` copy/replacement logic from `build-before-pack`.
4. Validate `user-api-preload.js` path in dev and production.
5. Keep `electron-builder` output names and included files compatible with existing publish scripts.

## Phase 7: TypeScript Cleanup

1. Convert high-traffic `.js` modules after their domain is migrated.
2. Remove Vue-specific helpers from shared utilities.
3. Replace global `Coral` namespace only if doing so does not explode churn; otherwise keep it and tighten module boundaries first.
4. Turn on stricter TS checks gradually:
   - `noImplicitAny`.
   - `strictNullChecks`.
   - `noUncheckedIndexedAccess` only after list/music code is ready.
5. Remove Webpack-only comments and loaders once Vite is the only build path.

## Risk Register

- Main and lyric renderers currently depend on Node integration and direct Electron IPC imports.
- Desktop lyric uses `MessageChannelMain`; losing that direct bridge can make lyric updates lag or break.
- Player logic depends on async cancellation, retry, source fallback, and WebAudio graph state.
- AudioWorklet and worker bundling are build-system-sensitive.
- DB worker native binding path is packaging-sensitive.
- User API execution is security-sensitive; do not weaken its isolation.
- Ant Design CSS reset, popup portals, focus management, and drag-region behavior may conflict with custom frameless Electron windows; verify menus, modals, dropdowns, and window controls in Electron, not just a browser.
- Many modules are still `.js` and rely on `allowJs`.
- Settings keys are flat strings; changing names breaks persisted config.
- List/dislike sync depends on local-vs-remote flags to prevent event echo.

## Acceptance Criteria

- `npm run dev` equivalent starts Electron, main React renderer, lyric React renderer, preload scripts, and workers.
- `npm run build` equivalent produces `dist/main.js`, `dist/index.html`, `dist/lyric.html`, `dist/user-api-preload.js`, and worker bundles.
- Existing package commands still include native modules, static assets, icons, and licenses.
- Current user data opens without DB migration errors.
- Core playback, list, search, settings, desktop lyric, sync, userApi, OpenAPI, and downloads behave like the old app.
- Main and lyric renderer IPC calls are typed at compile time.
- Ant Design is configured through a central provider, current theme colors are mapped through tokens, and high-traffic UI pages use antd components where they fit.
- Vue and Webpack dependencies can be removed only after feature parity is verified.
