# 2026-06-23 Step 18 - Leaderboard Store Service Wiring

## Scope

- Wired `LeaderboardStore` to `onlineMusicService`.
- Completed service-backed store foundations for the three online route groups: Search, SongList, and Leaderboard.

## Completed

- Added leaderboard board/detail loading state.
- Initialized leaderboard sources from `onlineMusicService`.
- Added `loadBoards()` for source board lists.
- Added `loadListDetail()` for leaderboard music pages.
- Added async result-key checks before applying detail results.
- Updated the Leaderboard route placeholder to show loading/error state.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`
- Note: renderer build still reports Node externalization and chunk-size warnings from the legacy online SDK path; this is expected until online code is split or moved behind Electron-safe adapters.

## Next Plan

- Add small route-level controls to trigger Search/SongList/Leaderboard store actions.
- Start extracting base/common React components needed by the online routes.
- Split the legacy online SDK path out of the first-screen bundle.
