# 2026-06-23 Refactor History: React App Shell

## Scope

Started Step 1 of the component migration plan: React app skeleton and providers for the main renderer.

## Completed

- Added `src/renderer-react/app/providers.tsx`.
- Added `src/renderer-react/app/routeConfig.tsx`.
- Added `src/renderer-react/app/router.tsx`.
- Added `src/renderer-react/app/AppShell.tsx`.
- Simplified `src/renderer-react/App.tsx` to compose `AppProviders` and `AppShell`.
- Moved route/menu declarations out of the root app component.
- Added placeholder route surfaces for:
  - search
  - song-list
  - leaderboard
  - list
  - download
  - setting
- Added a player bar slot and a frameless-window drag region placeholder.
- Updated `RootStore.migrationStage`.
- Narrowed `RouterOutlet` to an explicit `ReactElement` return to satisfy the typed ESLint rules.

## Current Status

- Main React renderer now has a stable host structure for future migrated components.
- Route switching is internal and MobX-backed through `SettingsStore.activeRoute`.
- No legacy Vue component has been deleted in this batch.
- Legacy Vue SFC count remains 122.

## Validation

Passed for this batch:

- `npm run lint`
- `npm run build`

Notes:

- Vite still reports chunk-size warnings for the current Ant Design-backed placeholder bundles; this is expected before route-level code splitting.

## Next Plan

1. Add typed IPC contracts under `src/shared/ipc`.
2. Add renderer service wrappers under `src/renderer-react/services`.
3. Hydrate settings and theme from the main process into MobX stores.
4. Start desktop lyric migration after the settings/theme foundation is stable.
