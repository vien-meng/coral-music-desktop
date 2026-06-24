# Step 71: Local List Persistent Reorder

## Summary

- Continued Step 11 after display sorting landed in Step 70.
- Added React-side persistent selected-song reorder support for the local list route.
- Kept the migration focused on the existing `list_music_update_position` IPC instead of introducing a new channel.

## Changes

- Updated `src/shared/ipc/contracts.ts`.
  - Added typed `player.listMusicUpdatePosition`.
  - Added the invoke contract for `LX.List.ListActionMusicUpdatePosition`.
- Updated `src/renderer-react/services/listService.ts`.
  - Added `updateListMusicsPosition(listId, position, ids)`.
- Updated `src/renderer-react/stores/domains/listStore.ts`.
  - Added `moveSelectedMusicsToPosition(position, musicInfos)`.
  - Keeps local `selectedMusics` order in sync after the persisted IPC succeeds.
- Updated `src/renderer-react/features/list/LocalListRoutePanel.tsx`.
  - Added target-position input.
  - Added move-to-position, top, and bottom actions for selected songs.
  - Reuses the visible selected-song order produced by current filter/sort controls.

## Validation

- `npx eslint src/shared/ipc/contracts.ts src/renderer-react/services/listService.ts src/renderer-react/stores/domains/listStore.ts src/renderer-react/features/list/LocalListRoutePanel.tsx`
- `npm run typecheck:react`
- `npm run lint`
- `npm run build:renderer`
- `npm run build`

## Boundaries

- This does not implement drag-and-drop reorder.
- This does not migrate the full legacy context menu.
- This does not migrate duplicate detection, import/open list, or list-share flows.
- It keeps the old Vue List module in place until those remaining workflows are covered.

## Next Plan

1. Port context menu actions as explicit React toolbar/dropdown actions first.
2. Add duplicate detection and duplicate-removal review UI.
3. Add import/open list flows.
4. Recount remaining Vue files and delete `src/renderer/views/List` only after feature parity and full validation.
