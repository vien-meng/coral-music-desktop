# 2026-06-23 Step 11 - Main Renderer Domain Stores

## Scope

- Continued Step 3 of the component migration plan for the main React renderer.
- Split shell-facing state out of `SettingsStore` into dedicated MobX domain stores.

## Completed

- Added `src/renderer-react/stores/domains/uiStore.ts` for route and sidebar state.
- Added `src/renderer-react/stores/domains/themeStore.ts` for theme collections, theme IPC updates, and theme-mode switching through the legacy settings IPC path.
- Added `src/renderer-react/stores/domains/playerStore.ts` for first player command/status state.
- Added `src/renderer-react/stores/domains/listStore.ts` with initial user-list hydration through `listService`.
- Added `src/renderer-react/stores/domains/downloadStore.ts` with initial download-task hydration through `downloadService`.
- Updated `RootStore` initialization to hydrate settings first, then theme/list/download domain stores.
- Updated `AppProviders` to use `ThemeStore`.
- Updated `AppShell` to use `UiStore`, `ThemeStore`, `PlayerStore`, `ListStore`, and `DownloadStore`.
- Updated the main shell footer from a placeholder into a first React player command surface.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Add `SearchStore`, `SongListStore`, and `LeaderboardStore` foundations before porting the corresponding Vue views.
- Add route-level placeholder components that read from the new stores so future migrated view components have stable props.
- Keep the legacy `src/renderer` Vue tree in place until React views are wired and smoke-tested.
