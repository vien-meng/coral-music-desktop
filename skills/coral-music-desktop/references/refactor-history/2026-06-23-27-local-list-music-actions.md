# 2026-06-23 Step 27 - Local List Music Actions

## Scope

- Added the first React local-list music mutation actions.
- Continued using the existing player list IPC/event pipeline.

## Completed

- Added typed IPC contracts for:
  - `player_list_music_remove`
  - `player_list_music_clear`
- Added list service methods:
  - `removeListMusics()`
  - `clearListMusics()`
- Added `ListStore` music mutation state and actions:
  - `removeMusicFromSelectedList()`
  - `clearSelectedListMusics()`
- Extended `LocalListRoutePanel` with:
  - clear selected list songs action with confirmation,
  - remove row action for local music previews.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Add list/music reorder support.
- Add move-to-list and duplicate-check flows.
- Extract local music row actions into a dedicated component before replacing the preview list.
