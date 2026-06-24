# 2026-06-23 Step 60: Play Detail Lyric Menu

## Context

Step 59 completed scoped fullscreen keyboard behavior for the React play-detail overlay. The next Step 8 task was to port the legacy `components/layout/PlayDetail/components/LyricMenu.vue` behavior without pulling the old Vue player/event layer into React.

## Changes

- Added `src/renderer-react/services/lyricService.ts`.
  - Exposes React-facing typed helpers for raw/edited lyric reads.
  - Exposes edited lyric save/remove helpers over the existing main-process lyric DB IPC.
- Extended `src/shared/ipc/contracts.ts`.
  - Added `getLyricRaw`, `getLyricEdited`, `saveLyricEdited`, and `removeLyricEdited` channels.
- Added `src/renderer-react/components/player/LyricMenu.tsx`.
  - Provides an Ant Design popover menu from the play-detail extra controls.
  - Supports play-detail lyric font-size adjustment with 5-step click and 1-step context-click behavior.
  - Supports lyric alignment switching between left and center.
  - Supports lyric offset reset and +/- 10ms / +/- 100ms edits.
  - Saves edited lyric offset through `lyricService` and removes the edited lyric when reset to the raw offset.
- Updated `PlayerStore`.
  - Added `currentLyricInfo`.
  - Added `updateLyricSnapshot()` so saved offset edits update the React player status immediately.
- Updated `PlayDetailOverlay` and global CSS.
  - Mounted the React lyric menu.
  - Applies `playDetail.style.fontSize` and `playDetail.style.align` to lyric rendering.

## Validation

- `npx eslint src/renderer-react/components/player/LyricMenu.tsx src/renderer-react/components/player/PlayDetailOverlay.tsx src/renderer-react/stores/domains/playerStore.ts src/renderer-react/services/lyricService.ts` passed.
- `npm run typecheck:react` passed.
- `npm run build:renderer` passed.
- `npm run build` passed.
- `npm run lint` still fails on the known 753 historical errors outside this batch; this batch did not increase the current baseline.

## Boundaries

- The menu is mounted from the React control area instead of a lyric-area context-menu teleport.
- The React lyric display is still a lightweight line list, not the full old scroll/select lyric engine.
- This batch does not port comment display or comment floor interactions.
- This batch does not add a dedicated visual smoke test.

## Next Plan

1. Port lyric selection/copy mode so React Play Detail can expose full lyric text separately from active-line display.
2. Add played-history/dislike/invalid-file skip rules after list state is sufficiently migrated.
3. Persist source-toggle fallback metadata after list/download mutation boundaries are stable.
4. Port play-detail comments after lyric controls and overlay state ownership are stable.
