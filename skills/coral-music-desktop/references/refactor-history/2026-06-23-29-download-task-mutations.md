# 2026-06-23 Step 29 - Download Task Mutations

## Scope

- Continued the React migration for the Download route.
- Added safe persisted task mutations before migrating the active download worker lifecycle.

## Completed

- Added typed IPC contracts for:
  - `download_list_remove`
  - `download_list_clear`
- Added React download service wrappers:
  - `removeDownloadTasks()`
  - `clearDownloadTasks()`
- Extended `DownloadStore` with:
  - `isMutatingTask`
  - `actionError`
  - `completedTaskCount`
  - `removeTask()`
  - `clearTasks()`
- Extended `DownloadRoutePanel` with:
  - clear-all task action
  - per-row remove task action
  - completed task count
  - visible action errors

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Start a React settings route scaffold over `SettingsStore`.
- Migrate the first basic/play/download persisted setting groups through Ant Design forms.
- Map the old download worker hooks before adding start/pause/resume controls.
