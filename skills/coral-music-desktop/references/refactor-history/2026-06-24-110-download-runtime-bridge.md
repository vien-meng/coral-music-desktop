# Step 110: Download Runtime Bridge

## Summary

- Implemented the first React/Electron download runtime bridge after Step 109 dev startup stabilization.
- Download tasks are no longer limited to creation and DB persistence: React can start, pause, retry, and receive progress/status updates through typed IPC.
- The runtime does not restore `src/renderer` or `window.coral.worker`; URL resolution remains in `src/renderer-react`, while filesystem download execution lives in the main process.

## Changes

- Added typed IPC channels for:
  - `downloadTaskStart`
  - `downloadTaskPause`
  - `downloadTaskRetry`
  - `downloadTaskAction`
  - `downloadListUpdate`
- Added `src/main/modules/winMain/downloadRuntime.ts`:
  - owns active downloader instances,
  - reuses `@common/utils/download.createDownload`,
  - checks/creates `download.savePath`,
  - respects `download.skipExistFile`,
  - persists task snapshots through the existing DB download list service,
  - broadcasts `start`, `progress`, `statusText`, `error`, `complete`, and `refreshUrl`.
- Updated React `downloadService` and `downloadStore`:
  - resolve music URLs before starting a task,
  - call typed main-process runtime commands,
  - subscribe to runtime task events,
  - merge task snapshots into MobX state,
  - auto-refresh URL once when the main process reports an expired download URL.
- Updated `DownloadRoutePanel`:
  - single-task start, pause, retry controls,
  - batch start and pause controls,
  - retained completed-task playback and file-location actions.
- Removed a renderer dev dependency trap in `@common/utils/nodejs` by replacing its unused `@common/utils` logger import with `console.error`; this prevents Vite from pulling node-only `electron-log` into the renderer optimizer.
- Updated `component-migration-plan.md` so the next batch moves to queue scheduling and optional download side effects.

## Verification

- `npm run typecheck:react`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run dev`: passed startup smoke after clearing stale Vite optimize cache; renderer 9080, lyric 9081, renderer-scripts, main build, and Electron startup all reached ready state.
- `rg "download runtime is not migrated|window\\.lx\\.worker|@renderer/|../../renderer|../../../renderer" src/renderer-react src/main src/shared`: no matches.
- `find src -name "*.vue"`: no output.

## Next Step

- Step 111: add queue scheduling around `download.maxDownloadNum`, automatic waiting-task pickup, richer retry policy, lyric file export, embedded lyric/picture metadata, and post-complete integrity handling.
