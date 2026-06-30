# Step 88: Batch Download Modal

Date: 2026-06-24

## Summary

- Added a React `BatchDownloadModal` component for downloading multiple selected musics at once.
- When the user clicks "下载" on a row that is part of a multi-selection, the batch modal appears instead of the single quality modal.
- The batch modal lists up to 100 selected songs and offers quality choice buttons for mass download.
- Download creation still goes through the legacy worker (`window.coral.worker.download.createDownloadTasks`) + typed IPC (`winMain_download_list_add`).
- Deleted the now-unused `DuplicateMusicModal.vue` (MyList component) since React's duplicate review modal in Step 79 fully covers it.

## Changed Files

- `src/renderer-react/components/player/BatchDownloadModal.tsx` (new)
- `src/renderer-react/features/list/LocalListRoutePanel.tsx`
  - `handleDownload` now checks for multi-selection: if the clicked song is part of multiple selected rows, it opens `BatchDownloadModal` instead of `DownloadQualityModal`.
- `src/renderer/views/List/MyList/components/DuplicateMusicModal.vue` (deleted)

## Validation

- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

1. Run `npm run lint` and `npm run typecheck:react` for full verification.
2. After verifying parity, remove remaining `src/renderer/views/List` Vue files that are fully covered:
   - `src/renderer/views/List/MyList/components/ListUpdateModal.vue` (covered by React routes — but actually it's about online source sync, not covered; keep it)
   - `src/renderer/views/List/MusicList/useSort.js`, `useSearch.js`, etc. — delete old JS hooks that are no longer imported by React.
3. After that, clean up `src/renderer/components/common/DownloadModal.vue` and `DownloadMultipleModal.vue` once the React download modals are confirmed working end to end.
4. Keep drag/reorder as a dedicated interaction batch.
