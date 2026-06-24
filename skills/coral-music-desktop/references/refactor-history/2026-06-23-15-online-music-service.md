# 2026-06-23 Step 15 - Online Music Service

## Scope

- Started Step 10 preparation by extracting a React-facing online music service.
- Centralized access to the legacy online `musicSdk` before wiring Search, SongList, and Leaderboard stores.

## Completed

- Added `src/renderer-react/services/onlineMusicService.ts`.
- Added source discovery helpers for music search, song lists, and leaderboards.
- Added stateless service methods for:
  - music search
  - song-list search
  - song-list tags
  - song-list list/detail data
  - leaderboard board/detail data
- Normalized music search/detail results through `toNewMusicInfo` and de-duplicated by music id.
- Exported the service from `src/renderer-react/services/index.ts`.
- Updated the component migration plan with the Step 10 service-extraction status.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Wire `onlineMusicService` into `SearchStore`, `SongListStore`, and `LeaderboardStore`.
- Add loading/error state to the corresponding stores before replacing route placeholder cards.
- Move or wrap more of the legacy online SDK only after the React service boundary proves stable.
