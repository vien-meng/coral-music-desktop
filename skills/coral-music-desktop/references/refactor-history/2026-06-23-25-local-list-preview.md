# 2026-06-23 Step 25 - Local List Preview

## Scope

- Started the React migration for the local "My List" route.
- Added an actionable first surface for selecting a local list and previewing its songs.

## Completed

- Extended `ListStore` with:
  - selected list music state,
  - music loading/error state,
  - `selectedList` computed value,
  - `loadSelectedListMusics()`.
- Added `src/renderer-react/features/list/LocalListRoutePanel.tsx`.
  - Selects from hydrated user lists.
  - Loads songs for the selected list.
  - Reuses `OnlineMusicPreviewList` for a compact local song preview.
  - Supports play action from preview rows.
- Wired `LocalListRoutePanel` into the `/list` route placeholder.
- Added stable select sizing for local lists.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Add local-list create/rename/delete actions through typed IPC.
- Add remove/reorder actions for local list music.
- Replace the preview list with the full local music-list component once actions are complete.
