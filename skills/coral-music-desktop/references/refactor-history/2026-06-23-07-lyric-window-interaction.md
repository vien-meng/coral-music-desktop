# 2026-06-23 Refactor History: Lyric Window Interaction

## Scope

Continued Step 4 of the component migration plan: port desktop lyric window drag and resize behavior into React.

## Completed

- Added `src/lyric-react/hooks/useLyricWindowInteraction.ts`.
- Added `src/lyric-react/components/layout/ResizeHandles.tsx`.
- Wired move interactions into `src/lyric-react/App.tsx`.
- Added eight resize handles matching the legacy desktop lyric window:
  - left,
  - top,
  - right,
  - bottom,
  - top-left,
  - top-right,
  - bottom-left,
  - bottom-right.
- Reused typed `winLyric_set_win_bounds` and `winLyric_set_win_resizeable` service calls.
- Added resize handle CSS in `src/lyric-react/styles/index.css`.

## Current Status

- React lyric window can request main-process bounds updates for moving and resizing.
- Manual lyric-line scroll behavior is still pending.
- Pause-hide, hover-hide, and audio visualization are still pending.
- No legacy Vue files were deleted in this batch.
- Legacy Vue SFC count remains 122.

## Validation

Passed for this batch:

- `npm run lint`
- `npm run build:renderer-lyric`
- `npm run build`

Notes:

- The lyric renderer still reports the existing Vite chunk-size warning.

## Next Plan

1. Port pause-hide and hover-hide behavior.
2. Port manual lyric-line scroll behavior.
3. Port audio visualization.
