# 2026-06-23 Step 24 - Online Control Components

## Scope

- Extracted repeated online route controls into shared React components.
- Prepared a cleaner replacement path for legacy source selection, tag lists, and board lists.

## Completed

- Added `src/renderer-react/features/online/OnlineControls.tsx`.
  - `OnlineSourceSelect` for online source selection.
  - `OnlineTagCloud` for song-list hot tags.
  - `OnlineBoardSelector` for leaderboard board selection.
- Refactored `SearchRoutePanel` to use `OnlineSourceSelect`.
- Refactored `SongListRoutePanel` to use `OnlineSourceSelect` and `OnlineTagCloud`.
- Refactored `LeaderboardRoutePanel` to use `OnlineSourceSelect` and `OnlineBoardSelector`.
- Replaced route-specific board button CSS with reusable board selector row styling.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Continue extracting route-specific panels into smaller feature components where behavior has stabilized.
- Migrate download task creation behind a React-safe adapter.
- Replace preview rows with the full online row component needed for context menus and download actions.
