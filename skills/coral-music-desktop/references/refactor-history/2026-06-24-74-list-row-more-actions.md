# Step 74: Local List Row More Actions

## Summary

- Continued Step 11 after selected-list reorder.
- Migrated the first lightweight subset of the legacy music row context menu into React.
- Kept this batch frontend-only and avoided new backend channels.

## Changes

- Updated `src/renderer-react/features/list/LocalListRoutePanel.tsx`.
- Added a per-row `more` dropdown.
- Added `复制歌曲名`.
  - Copies `name - singer` to the clipboard.
  - Reports clipboard errors through the existing list action error surface.
- Added `搜索歌曲`.
  - Switches to the React Search route.
  - Seeds the search text from the selected music.
  - Uses the music source when it is one of the migrated online search sources.
  - Triggers the existing `SearchStore.submitSearch()` flow.

## Validation

- `npx eslint src/renderer-react/features/list/LocalListRoutePanel.tsx`
- `npm run typecheck:react`
- `npm run lint`
- `npm run build:renderer`
- `npm run build`

## Boundaries

- This does not migrate download, toggle-source, source detail, dislike, or play-later menu actions.
- It does not add right-click positioning behavior yet.
- It keeps the old List Vue module until the remaining menu/import/review flows are covered.

## Next Plan

1. Port remaining low-risk row actions into the same dropdown.
2. Add download and toggle-source only after their service/store boundaries are ready.
3. Add source-detail actions after the online SDK URL helpers are isolated for React.
4. Re-evaluate List Vue deletion after import/open and remaining menu parity.
