# Step 81: List Sort Vue Cleanup

Date: 2026-06-24

## Summary

- Cleaned legacy Vue sorting modules after Step 80 added React persistent sort/random-sort parity.
- Reduced the remaining legacy `.vue` inventory from 76 to 73.
- Kept unresolved List Vue files in place for behavior that still needs React coverage: source toggle, source/detail update, remaining context menu actions, and drag/reorder parity.

## Removed Files

- `src/renderer/views/List/MusicList/components/MusicSortModal.vue`
- `src/renderer/views/List/MyList/components/ListSortModal.vue`
- `src/renderer/views/List/MyList/components/MusicSortModal.vue`

## Current Vue Inventory

```text
total .vue: 73
 21  renderer/components/layout
 16  renderer/components/common
  7  renderer/views/songList
  7  renderer/views/List
  7  renderer/components/material
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

1. Run full validation after the cleanup.
2. Continue List route migration with source-toggle/source-update flows.
3. Port remaining context menu actions that depend on download and online-source detail workflows.
4. Leave drag/reorder for a dedicated interaction batch.
