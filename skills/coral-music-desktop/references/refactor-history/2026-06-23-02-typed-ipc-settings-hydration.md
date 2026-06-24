# 2026-06-23 Refactor History: Typed IPC And Settings Hydration

## Scope

Continued Step 2 and started Step 3 of the component migration plan: React-facing typed IPC contracts, compatibility service modules, and MobX settings hydration.

## Completed

- Added `src/shared/ipc/contracts.ts`.
- Added `src/renderer-react/services/ipc/client.ts`.
- Added React service modules:
  - `appService`
  - `dataService`
  - `settingService`
  - `themeService`
  - `listService`
  - `playerService`
  - `downloadService`
  - `syncService`
  - `openApiService`
  - `userApiService`
- Added `src/renderer-react/stores/domains/settingsStore.ts`.
- Kept `src/renderer-react/stores/settingsStore.ts` as a compatibility re-export.
- Wired `AppProviders` to initialize `RootStore`.
- Hydrated settings, env params, theme info, and initial theme mode through typed services.
- Persisted React theme-mode toggles through the legacy `common_set_app_setting` IPC path.
- Updated the migration dashboard to show settings hydration and theme mode state.
- Added `baseUrl` to `tsconfig.json` and `jsconfig.json` so path aliases are valid for TypeScript tooling.

## Current Status

- React code no longer needs to import `@renderer/utils/ipc` for new settings/theme work.
- IPC channel names still come from `src/common/ipcNames.ts`; no persisted setting key or IPC channel was renamed.
- `contextIsolation` remains unchanged while the typed service layer grows.
- Legacy Vue SFC count remains 122.

## Validation

Passed for this batch:

- `npm run lint`
- `npm run build:renderer`
- `npm run build`
- `rg -n "@renderer/utils/ipc|src/renderer/utils/ipc" src/renderer-react src/shared` returned no matches.

Notes:

- The Vite chunk-size warning remains expected until route-level code splitting is introduced.
- `npx tsc --noEmit --pretty false` was attempted after adding `baseUrl`, but it is still blocked by legacy `src/renderer`, `src/renderer-lyric`, and Vue-era imports/types that are no longer active build surfaces.

## Next Plan

1. Split `ThemeStore` and `UiStore` out of `SettingsStore` once settings page migration begins.
2. Extend typed IPC contracts while migrating list/player/search/download features.
3. Start desktop lyric migration after the settings/theme foundation is stable.
