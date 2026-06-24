# 2026-06-23 Step 20 - Online Route Action Panels

## Scope

- Turned the Search, Song List, and Leaderboard React route placeholders into minimally actionable panels.
- Kept the old Vue route files in place while adding React controls that exercise the new MobX stores and lazy online SDK service boundary.

## Completed

- Added `src/renderer-react/features/search/SearchRoutePanel.tsx`.
  - Supports search type switching, source switching, page input, query submission, loading/error states, and result previews.
- Added `src/renderer-react/features/song-list/SongListRoutePanel.tsx`.
  - Supports source switching, sort selection, tag loading, hot-tag clicks, list loading, detail loading, and result previews.
- Added `src/renderer-react/features/leaderboard/LeaderboardRoutePanel.tsx`.
  - Supports source switching, board loading, board selection, detail loading, and music previews.
- Wired the panels into `src/renderer-react/app/routeConfig.tsx`.
- Exposed song-list sort metadata through `onlineMusicService.getSongListSorts()`.
- Added `SongListStore` tag loading state and tag error tracking.
- Added route-panel CSS for stable control widths, bounded lists, hot-tag rows, and leaderboard board/music layout.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

Notes:

- The renderer still emits the expected `onlineMusicService` lazy chunk.
- Vite still reports legacy SDK Node externalization warnings; this batch did not expand the warning surface beyond the existing online SDK boundary.

## Next Plan

- Extract a reusable React online music preview/list component to reduce duplication across Search, Song List, and Leaderboard.
- Add pagination controls that call the same store actions for next/previous page.
- Start migrating online list row actions: play, add to local list, download, and context menus.
