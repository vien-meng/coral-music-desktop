# 2026-06-23 Step 22 - Online Music Row Actions

## Scope

- Added the first React row actions for online music preview rows.
- Kept actions on the existing Electron IPC/list/player contracts instead of importing legacy Vue row-action hooks.

## Completed

- Added `player_list_music_add` to `src/shared/ipc/contracts.ts`.
- Added `listService.addListMusics()` in `src/renderer-react/services/listService.ts`.
- Added `ListStore.addMusicsToList()` and action error state.
- Added `src/renderer-react/features/online/OnlineMusicRowActions.tsx`.
  - Play uses `PlayerStore.playMusic()`.
  - Add uses `ListStore.hydrate()` and app setting `list.addMusicLocationType` before invoking the existing list add IPC.
- Wired row actions into:
  - Search music previews.
  - Leaderboard music previews.
- Added visible action error alerts to the Search and Leaderboard panels.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Deferred

- Download row action is intentionally deferred. The old download path builds tasks through worker helpers, quality selection, URL lookup, metadata, lyrics, and save-path logic; it should be migrated as its own focused batch.

## Next Plan

- Migrate the download task creation service behind a React-safe adapter.
- Add row actions to song-list detail music previews once the detail preview is rendered.
- Start extracting a richer online row component that can replace `material/OnlineList/index.vue`.
