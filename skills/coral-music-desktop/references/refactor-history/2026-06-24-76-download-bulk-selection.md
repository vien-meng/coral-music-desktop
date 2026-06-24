# Step 76: Download Bulk Selection

## Summary

- Continued Download route migration after row more actions.
- Added the first React multi-select workflow for download tasks.
- Stayed inside the already migrated remove/play paths and did not touch the legacy download worker.

## Changes

- Updated `src/renderer-react/stores/domains/downloadStore.ts`.
  - Added `removeTasks(taskIds)`.
  - Kept `removeTask(taskId)` as a single-item wrapper.
- Updated `src/renderer-react/features/download/DownloadRoutePanel.tsx`.
  - Added per-row task checkbox.
  - Added select all/cancel all.
  - Added selected count.
  - Added play selected for completed tasks.
  - Added batch remove with confirmation.

## Validation

- `npx eslint src/renderer-react/stores/domains/downloadStore.ts src/renderer-react/features/download/DownloadRoutePanel.tsx`
- `npm run typecheck:react`
- `npm run lint`
- `npm run build:renderer`
- `npm run build`

## Boundaries

- This does not implement start/pause.
- This does not migrate single or batch download modals.
- This does not delete `src/renderer/views/Download` yet.

## Next Plan

1. Add a download runtime bridge before start/pause migration.
2. Port download modal and batch download modal.
3. Add full download task update event sync.
4. Delete legacy Download Vue files only after start/pause/add/open/remove parity is validated.
