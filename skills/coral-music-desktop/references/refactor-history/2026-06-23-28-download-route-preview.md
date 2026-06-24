# 2026-06-23 Step 28 - Download Route Preview

## Scope

- Started the React migration for the Download route.
- Added a read-only task preview before migrating task mutation and filesystem actions.

## Completed

- Added `DownloadStore.refreshTasks()` for explicit task reloads.
- Added `src/renderer-react/features/download/DownloadRoutePanel.tsx`.
  - Refreshes download tasks.
  - Displays task name, status, progress, and file path.
  - Shows download hydration errors.
- Wired `DownloadRoutePanel` into the `/download` route placeholder.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Add typed IPC/service methods for download remove/update/clear.
- Migrate start/pause/resume task controls after preserving the old worker task lifecycle.
- Add local file/open-directory actions through existing main-process helpers.
