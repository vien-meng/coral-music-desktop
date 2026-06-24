# Step 83: List Source Toggle Vue Cleanup

Date: 2026-06-24

## Summary

- Cleaned the legacy Vue source-toggle modal after Step 82 added React candidate search and replacement behavior.
- Reduced the remaining legacy `.vue` inventory from 73 to 72.
- Reduced `src/renderer/views/List` Vue files from 7 to 6.

## Removed Files

- `src/renderer/views/List/MusicList/components/MusicToggleModal.vue`

## Current Vue Inventory

```text
total .vue: 72
 21  renderer/components/layout
 16  renderer/components/common
  7  renderer/views/songList
  7  renderer/components/material
  6  renderer/views/List
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
2. Continue List migration with source detail/update and download menu actions.
3. Keep drag/reorder for a dedicated interaction batch.
4. Remove more List Vue files only after their React replacements are wired and validated.
