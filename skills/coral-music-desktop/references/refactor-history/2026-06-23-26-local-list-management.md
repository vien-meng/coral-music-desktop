# 2026-06-23 Step 26 - Local List Management

## Scope

- Added the first React local-list management actions.
- Kept list changes on the existing main-process list event contract.

## Completed

- Added typed IPC contracts for:
  - `player_list_add`
  - `player_list_remove`
  - `player_list_update`
- Added list service methods:
  - `createUserLists()`
  - `removeUserLists()`
  - `updateUserLists()`
- Added `ListStore` mutations:
  - `createUserList()`
  - `renameSelectedList()`
  - `removeSelectedList()`
- Extended `LocalListRoutePanel` with:
  - create-list input and action,
  - rename selected list input and action,
  - delete selected list action with confirmation,
  - visible action errors.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Add local list music removal and clear actions.
- Add list reorder support after a React drag/sort strategy is selected.
- Migrate context menus once the local music row component is no longer a preview.
