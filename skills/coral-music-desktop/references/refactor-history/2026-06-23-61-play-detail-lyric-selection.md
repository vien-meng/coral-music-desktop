# 2026-06-23 Step 61: Play Detail Lyric Selection

## Context

Step 60 ported the React lyric menu for font size, alignment, and lyric offset edits. The remaining lyric-side gap in Step 8 was making full lyric text selectable/copyable, because the current React overlay only showed a compact active-line preview.

## Changes

- Added `clipboardService`.
  - Uses browser clipboard when available.
  - Falls back to Electron `clipboard.writeText()` through the existing non-isolated renderer environment.
- Updated `PlayerStore`.
  - Added `isLyricSelectionOpen`.
  - Added `lyricSelectionText` and `lyricSelectionLines`.
  - Added lyric text cleanup for LRC time/meta tags.
  - Added selection mode toggle/close helpers and closes the mode when Play Detail closes.
- Added `LyricSelectionPanel`.
  - Shows full cleaned lyric text in a selectable scroll region.
  - Copies all lyrics from the panel action.
  - Copies selected lyric text from the panel context menu.
- Updated `PlayDetailOverlay`.
  - Added a lyric text toggle button to the extra controls.
  - Switches the center panel between compact lyric preview and full lyric selection mode.
- Added CSS for the selectable lyric text panel.

## Validation

- `npx eslint src/renderer-react/components/player/LyricSelectionPanel.tsx src/renderer-react/components/player/PlayDetailOverlay.tsx src/renderer-react/stores/domains/playerStore.ts src/renderer-react/services/clipboardService.ts` passed.
- `npm run typecheck:react` passed.
- `npm run build:renderer` passed.
- `npm run build` passed.
- `npm run lint` still fails on the known 753 historical errors outside this batch; this batch did not increase the current baseline.

## Boundaries

- This is selectable text parity, not full old lyric scroll-sync parity.
- The selection panel uses cleaned lyric text and does not preserve per-line extended lyric timing structure.
- Clipboard behavior was build/type verified but not manually smoked in a running Electron window.
- Play Detail comments remain pending.

## Next Plan

1. Decide whether to port Play Detail comments now or defer until online API/comment service boundaries are mapped.
2. Add played-history/dislike/invalid-file skip rules after list state is sufficiently migrated.
3. Persist source-toggle fallback metadata after list/download mutation boundaries are stable.
4. Add fullscreen-change event sync only if a reliable main-process renderer event is introduced.
