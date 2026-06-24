# 2026-06-23 Refactor History: Lyric Control Bar

## Scope

Continued Step 4 of the component migration plan: port the desktop lyric control bar from Vue to React.

## Completed

- Added `src/lyric-react/components/layout/ControlBar.tsx`.
- Replaced inline toolbar controls in `src/lyric-react/App.tsx` with `ControlBar`.
- Mapped legacy SVG controls to Ant Design icon buttons for:
  - close desktop lyric,
  - lock/unlock,
  - font size increase/decrease,
  - opacity increase/decrease,
  - current-line zoom toggle,
  - always-on-top toggle,
  - horizontal/vertical direction switch,
  - main-window connection status.
- Added store actions for close, always-on-top, active-line zoom, font-size changes, and opacity changes.
- Updated `src/lyric-react/styles/index.css` for the hover-revealed control bar.

## Current Status

- Desktop lyric control actions now persist through the typed `winLyric_set_config` path.
- Legacy `Icons.vue` is covered by React icon imports.
- Drag-to-move and resize handles are still pending.
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

1. Port window drag and resize behavior from `useDrag.js` and `useWindowSize.ts`.
2. Port pause-hide and hover-hide behavior.
3. Port audio visualization.
