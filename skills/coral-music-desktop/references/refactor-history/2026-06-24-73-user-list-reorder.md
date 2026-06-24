# Step 73: User List Persistent Reorder

## Summary

- Continued Step 11 after duplicate removal.
- Added React-side persistent top/bottom reorder for the selected user list.
- Reused the existing `list_update_position` main-process contract.

## Changes

- Updated `src/shared/ipc/contracts.ts`.
  - Added typed `player.listUpdatePosition`.
  - Added the invoke contract for `LX.List.ListActionUpdatePosition`.
- Updated `src/renderer-react/services/listService.ts`.
  - Added `updateUserListsPosition(position, ids)`.
- Updated `src/renderer-react/stores/domains/listStore.ts`.
  - Added `moveSelectedListToPosition(position)`.
  - Updates local user-list order after the persisted IPC succeeds.
- Updated `src/renderer-react/features/list/LocalListRoutePanel.tsx`.
  - Added `列表置顶` and `列表置底` actions beside the list selector.

## Validation

- `npx eslint src/shared/ipc/contracts.ts src/renderer-react/services/listService.ts src/renderer-react/stores/domains/listStore.ts src/renderer-react/features/list/LocalListRoutePanel.tsx`
- `npm run typecheck:react`
- `npm run lint`
- `npm run build:renderer`
- `npm run build`

## Boundaries

- This does not implement drag-and-drop list reorder.
- This does not migrate the full legacy list sort modal.
- This keeps `src/renderer/views/List` until context menus, import/open list, and remaining review flows are migrated.

## Next Plan

1. Port remaining context menu actions into explicit React dropdown/toolbar actions.
2. Add import/open list flow support.
3. Add duplicate review modal parity if needed.
4. Delete `src/renderer/views/List` only after route parity and full validation.
