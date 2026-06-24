# Step 86: List Download Row Action

Date: 2026-06-24

## Summary

- Continued List route parity after source-detail action.
- Added a React "下载" row action in the list row dropdown menu.
- Created `src/renderer-react/services/downloadService.ts` as a placeholder stub. The actual download-modal and download-worker integration will come in a follow-up batch.

## Changed Files

- `src/renderer-react/services/downloadService.ts`
  - Created with a static `triggerDownload` method placeholder.
- `src/renderer-react/features/list/LocalListRoutePanel.tsx`
  - Added `DownloadOutlined` import.
  - Added `handleDownload` handler.
  - Added "下载" dropdown menu item (disabled for local sources).

## Validation

- Passed: `npx eslint src/renderer-react/features/list/LocalListRoutePanel.tsx`
- Passed: `npm run typecheck:react`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

1. Integrate download-modal parity so the download action actually opens a real download dialog.
2. After download parity, audit and remove more `src/renderer/views/List` Vue files that are now fully covered.
3. Keep drag/reorder as a dedicated interaction batch.
