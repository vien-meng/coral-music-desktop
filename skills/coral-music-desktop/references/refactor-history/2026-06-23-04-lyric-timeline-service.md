# 2026-06-23 Refactor History: Lyric Timeline Service

## Scope

Continued Step 4 of the component migration plan: migrate the desktop lyric timeline behavior from the legacy lyric renderer into the React lyric surface.

## Completed

- Added `src/common/utils/lyric-font-player/index.d.ts` so the shared JS lyric player can be consumed safely from TypeScript.
- Added `src/lyric-react/services/lyricTimeline.ts`.
- Connected `LyricRootStore` to the shared lyric player for:
  - lyric parsing and line setup,
  - active line updates through `onPlay`,
  - lyric offset updates,
  - playback rate updates,
  - horizontal/vertical timeline mode updates,
  - play/pause/stop actions from the main-window MessagePort.
- Removed the temporary hand-written timestamp stripping path from `LyricRootStore`.

## Current Status

- Desktop lyric React now has the same core timeline engine as the legacy Vue lyric window.
- React lyric UI still renders a simplified current/next line shell; the full horizontal/vertical DOM layout components are next.
- No legacy Vue files were deleted in this batch.
- Legacy Vue SFC count remains 122.

## Validation

Passed for this batch:

- `npm run lint`
- `npm run build:renderer-lyric`
- `npm run build`
- `rg -n "@lyric|renderer-lyric|@renderer/utils/ipc|src/renderer" src/lyric-react src/shared` returned no matches.

Notes:

- The lyric renderer still reports the existing Vite chunk-size warning.

## Next Plan

1. Port `LyricHorizontal` and `LyricVertical` React components around `timelineLines`.
2. Port control bar icons/actions.
3. Port resize/drag handling, pause-hide, hover-hide, and audio visualization.
