# Step 107: Download Task Factory

## Summary
- Added `src/renderer-react/services/downloadTaskFactory.ts` with React-owned download task creation logic ported from the old download worker:
  - file extension selection
  - quality fallback selection
  - download list item construction
- Refactored `downloadService.createDownloadTasks()` to use the React task factory and persist tasks through typed IPC.
- Removed direct `window.lx.worker.download.createDownloadTasks` usage from:
  - `DownloadQualityModal.tsx`
  - `BatchDownloadModal.tsx`
- Corrected the typed IPC contract for `downloadListAdd` to use `LX.Download.saveDownloadMusicInfo`.
- Replaced the missing `openPath` IPC call with Electron shell `showItemInFolder` from the renderer runtime.
- Left `startDownloadTask()` and `pauseDownloadTask()` as explicit no-op runtime placeholders until the full download executor is migrated.

## Verification
- `npm run build:renderer` passed after the task factory migration.
- React and lyric source no longer import the old renderer SDK path or access `window.lx.worker.download`.
- `npm run typecheck:react` now covers `downloadService`, `downloadTaskFactory`, the download modals, music SDK wrappers, and online/player URL services.

## Next Step
- Step 108: delete the remaining `src/renderer` compatibility island and update the master migration plan.
