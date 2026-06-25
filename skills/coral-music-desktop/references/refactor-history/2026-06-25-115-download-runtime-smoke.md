# Step 115: Download Runtime Smoke

## Summary

- Continued after Step 114 dev startup stabilization.
- Added a repeatable download runtime smoke command that runs through Electron dev mode and a local HTTP fixture.
- The first smoke run exposed a real runtime bug: main-process download code was treating Comlink DB worker methods as synchronous arrays/objects.
- Fixed the DB worker async reads in the download runtime and reran the smoke to completion.

## Changes

- Added `npm run smoke:download`.
  - Uses `CORAL_DOWNLOAD_SMOKE=true` with the existing dev runner.
  - Starts renderer, lyric, preload, main, and Electron like normal dev mode.
  - Runs the smoke automatically after app initialization and exits Electron when complete.
- Added `src/main/modules/winMain/downloadSmoke.ts`.
  - Creates a local HTTP fixture server on `127.0.0.1`.
  - Writes downloads into a temporary OS directory, not the user's configured download path.
  - Creates isolated smoke download tasks in the DB.
  - Verifies start/progress, pause, retry, completion, completed-file size, failed URL error state, retry recovery, and `.lrc` sidecar output.
  - Cleans smoke DB tasks and temp files in `finally`.
- Updated `src/main/index.ts` to call the smoke harness only when `CORAL_DOWNLOAD_SMOKE=true`.
- Fixed `src/main/modules/winMain/downloadRuntime.ts`:
  - awaits `dbService.getDownloadList()` before searching task state,
  - awaits `dbService.getPlayerLyric()` before writing sidecar lyrics or embedded metadata,
  - awaits critical `downloadInfoUpdate` calls before returning started, paused, or completed states.
- Updated `component-migration-plan.md`:
  - marked the download executor migration task complete,
  - moved the next batch to Step 116 automated route/service smoke, Step 117 bundle warning cleanup, Step 118 polish, and Step 119 release readiness.

## Verification

- `npm run typecheck:react`: passed.
- `npm run lint`: passed.
- `npm run build:main`: passed.
- `npm run smoke:download`: passed.
  - Output included `[downloadSmoke] passed`.
- `npm run build`: passed.
  - Remaining warnings are non-blocking renderer bundle warnings from Node-oriented dependencies such as `needle`, `tunnel`, `electron-log`, and `src/common/utils/lyricUtils/kg.js`.
- `find src -name "*.vue"`: no output.
- React/lyric old renderer reference search:
  - `rg "window\\.lx\\.worker|@renderer/|../../renderer|../../../renderer" src/renderer-react src/lyric-react`: no output.

## Remaining Risks

- The new smoke covers the main-process runtime and local fixture downloads, not a full UI click-through.
- Renderer store queue behavior is still covered by build/type checks and should receive targeted automated smoke in Step 116.
- Metadata embedding is wired and build-validated, but the smoke disables embedded metadata to avoid writing synthetic MP3 tags into a fixture file. A dedicated metadata fixture can be added later if needed.

## Next Step

- Step 116: add targeted automated smoke coverage for migrated route and service surfaces:
  - search,
  - song-list plaza/detail,
  - leaderboard,
  - local-list sort/drag/download actions,
  - playback URL resolution,
  - download store queue/task control.
