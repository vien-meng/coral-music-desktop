# Step 77: Cleanup Audit And Route Hints

## Summary

- Audited remaining Vue files after Steps 70-76.
- Confirmed no newly completed List or Download Vue module can be safely deleted yet.
- Updated React route next-step copy so the in-app migration status matches the current plan.

## Vue Inventory

```text
total .vue: 76
 21  renderer/components/layout
 16  renderer/components/common
 10  renderer/views/List
  7  renderer/views/songList
  7  renderer/components/material
  4  renderer/views/Search
  4  renderer-lyric/components/layout
  3  renderer/views/Leaderboard
  1  renderer/views/Download
  1  renderer/App.vue
  1  renderer-lyric/components/common
  1  renderer-lyric/App.vue
```

## Cleanup Decision

- `src/renderer/views/List` stays because drag/reorder, remaining context menu actions, import/open-list flows, and duplicate review modal parity are still pending.
- `src/renderer/views/Download` stays because start/pause/update and download-modal flows still depend on the legacy renderer download worker.
- Already cleaned modules only appear in migration history and plan references, not active source imports.

## Changes

- Updated `src/renderer-react/app/routeConfig.tsx`.
  - List next step now points to drag/reorder, remaining menus, import/open-list, and duplicate review parity.
  - Download next step now points to download worker bridge, start/pause/update events, and download dialogs.

## Validation

- `npx eslint src/renderer-react/app/routeConfig.tsx`
- `npm run typecheck:react`

## Next Plan

1. Design a React-safe download runtime bridge before attempting start/pause.
2. Continue List route with import/open-list or duplicate review modal parity.
3. Delete Vue directories only after the corresponding React route has complete workflow parity and passes full validation.
