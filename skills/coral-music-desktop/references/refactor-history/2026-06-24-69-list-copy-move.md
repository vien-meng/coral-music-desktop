# Step 69: List Copy And Move Actions

## Context

Step 68 added current-list search/filter. The next List parity gap was moving or copying selected songs between user lists, covered in the legacy tree by `useMusicAdd` / `useMusicToggle` and the `list_music_move` IPC channel.

## Changes

- Added typed React IPC coverage for `player.listMusicMove`.
- Added `listService.moveListMusics`.
- Added `ListStore.copyMusicsToList` and `ListStore.moveMusicsToList`.
- Added target-list selection to `LocalListRoutePanel`.
- Added selected-song actions:
  - copy selected songs to another list;
  - move selected songs to another list with confirmation.
- Reused persisted `list.addMusicLocationType` setting for target insertion behavior.

## Validation

- `npx eslint src/shared/ipc/contracts.ts src/renderer-react/services/listService.ts src/renderer-react/stores/domains/listStore.ts src/renderer-react/features/list/LocalListRoutePanel.tsx`
- `npm run typecheck:react`
- `npm run lint`
- `npm run build:renderer`
- `npm run build`

## Boundaries

- This does not yet port drag/reorder, sort modals, duplicate detection, or full context menu parity.
- The old `src/renderer/views/List` remains until those workflows are replaced and smoke-tested.

## Next Plan

1. Add list/music sorting surfaces.
2. Add context menu parity on top of the now-stable command set.
3. Add drag/reorder only after sorting and move actions are stable.
