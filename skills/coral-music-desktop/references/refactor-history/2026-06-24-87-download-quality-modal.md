# Step 87: Download Quality Modal

Date: 2026-06-24

## Summary

- Continued List route parity after download row action.
- Created React `DownloadQualityModal` component, which mirrors the legacy `DownloadModal.vue` behavior: shows available quality options for a music item and triggers download via the legacy worker (`window.lx.worker.download.createDownloadTasks`) + typed IPC (`winMain.downloadListAdd`).
- Added `downloadListAdd` IPC channel to `src/shared/ipc/contracts.ts`.
- Successfully built.

## Changed Files

- `src/renderer-react/components/player/DownloadQualityModal.tsx` (new)
  - Accepts `musicInfo`, `listId`, `onClose`.
  - Renders quality buttons from `musicInfo.meta.qualitys`.
  - Calls `window.lx.worker.download.createDownloadTasks()` then `ipcClient.invoke(winMain.downloadListAdd, ...)`.
- `src/shared/ipc/contracts.ts`
  - Added `winMain.downloadListAdd` IPC channel definition.
- `src/renderer-react/features/list/LocalListRoutePanel.tsx`
  - Replaced old `handleDownload` stub with `setDownloadModalMusic()` state.
  - Added `<DownloadQualityModal>` component to the render tree.
- `src/renderer-react/services/downloadService.ts`
  - Simplified to static class stub (no longer imported by `downloadStore`).

## Validation

- Passed: `npm run lint`
- Passed: `npm run typecheck:react`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

1. Test downloaded task creation end to end by smoke testing the download modal from the list route.
2. Once download parity is stable, audit `src/renderer/views/List` remaining 5 .vue files and the two legacy download modals for removal.
3. Keep drag/reorder as a dedicated interaction batch.
