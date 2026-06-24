# Step 89: Download Multi-Selection Flow

Date: 2026-06-24

## Summary

- Enhanced the "下载" row action to detect multi-selection: if the clicked song is part of multiple selected rows, a `BatchDownloadModal` opens instead of the single-song `DownloadQualityModal`.
- The batch modal lists up to 100 selected songs and provides quality choice buttons.
- Both download modals now consistently use the legacy worker + typed IPC.

## Changed Files

- `src/renderer-react/features/list/LocalListRoutePanel.tsx`
  - `handleDownload` now checks `selectedMusics.length` and opens BatchDownloadModal for multi-selection.
- `src/renderer-react/components/player/BatchDownloadModal.tsx`
  - Created: shows selected songs list and quality buttons.

## Validation

- Passed: `npm run lint`
- Passed: `npm run typecheck:react`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Remaining List Parity Gaps

1. Drag/reorder (interaction batch)
2. `ListUpdateModal.vue` (source list sync/auto-update settings — requires React side of song list management)
3. Hooks referenced only in old Vue `MusicList/index.vue` and `MyList/index.vue` (can't delete until those Vue files are removed)
4. `DownloadModal.vue` / `DownloadMultipleModal.vue` — still templated in Vue `OnlineList` and old `List` vue files

## Next Plan

1. Remove the remaining List Vue files that are confirmed dead after verifying that old Vue is never loaded for list routes.
2. Port drag/reorder after list store and row rendering are final.
3. Remove old download modals together with their host Vue files.
