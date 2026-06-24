# Step 75: Download Row More Actions

## Summary

- Continued after Step 74 List row menu migration.
- Moved the Download route forward without touching the legacy download worker.
- Added the first React row menu actions for downloaded tasks.

## Changes

- Updated `src/shared/ipc/contracts.ts`.
  - Added typed send channel `winMain.openDirInExplorer`.
- Updated `src/renderer-react/services/downloadService.ts`.
  - Added `openDownloadTaskFile(filePath)`.
- Updated `src/renderer-react/stores/domains/downloadStore.ts`.
  - Added `openTaskFile(task)`.
- Updated `src/renderer-react/features/download/DownloadRoutePanel.tsx`.
  - Added per-row more dropdown.
  - Added `打开文件位置`.
  - Added `搜索歌曲`, reusing the React `SearchStore` route flow.

## Validation

- `npx eslint src/shared/ipc/contracts.ts src/renderer-react/services/downloadService.ts src/renderer-react/stores/domains/downloadStore.ts src/renderer-react/features/download/DownloadRoutePanel.tsx`
- `npm run typecheck:react`
- `npm run lint`
- `npm run build:renderer`
- `npm run build`

## Boundaries

- This does not implement start/pause because those paths still rely on the old renderer download worker.
- This does not migrate the single or batch download modal.
- This does not delete `src/renderer/views/Download` yet.

## Next Plan

1. Add a React-facing download runtime bridge for start/pause/update if the legacy worker can be isolated safely.
2. Port download modal and batch download modal.
3. Delete `src/renderer/views/Download` and common download modals only after start/pause/open/add flows pass validation.
