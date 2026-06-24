# Step 84: List Search Vue Cleanup

Date: 2026-06-24

## Summary

- Cleaned the legacy Vue current-list search component after React already provided current-list search/filter and count status in Step 68.
- Reduced the remaining legacy `.vue` inventory from 72 to 71.
- Reduced `src/renderer/views/List` Vue files from 6 to 5.

## Removed Files

- `src/renderer/views/List/MusicList/components/SearchList.vue`

## Current Vue Inventory

```text
total .vue: 71
 21  renderer/components/layout
 16  renderer/components/common
  7  renderer/views/songList
  7  renderer/components/material
  5  renderer/views/List
  4  renderer/views/Search
  4  renderer-lyric/components/layout
  3  renderer/views/Leaderboard
  1  renderer/views/Download
  1  renderer-lyric/components/common
  1  renderer-lyric/App.vue
  1  renderer/App.vue
```

## Validation

- Passed: `npm run lint`
- Passed: `npm run typecheck:react`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

1. Run full validation after cleanup.
2. Continue List route parity with source detail/update and download actions.
3. Keep the remaining List Vue entry/index files until drag/reorder and context menu parity are complete.
