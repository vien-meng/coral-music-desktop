# 2026-06-23 Step 21 - Online Preview List Components

## Scope

- Reduced duplication across Search, Song List, and Leaderboard route panels.
- Added reusable React preview components that prepare the path for migrating the legacy `material/OnlineList` and pagination components.

## Completed

- Added `src/renderer-react/features/online/OnlinePreviewList.tsx`.
  - `OnlinePager` provides previous/next icon buttons plus page input.
  - `OnlineMusicPreviewList` renders shared online music preview rows.
  - `OnlineSongListPreviewList` renders shared online song-list preview rows with optional row actions.
- Refactored `SearchRoutePanel` to use `OnlinePager`, `OnlineMusicPreviewList`, and `OnlineSongListPreviewList`.
- Refactored `SongListRoutePanel` to use `OnlinePager` and `OnlineSongListPreviewList`.
- Refactored `LeaderboardRoutePanel` to use `OnlinePager` and `OnlineMusicPreviewList`.
- Added pager layout CSS in `src/renderer-react/styles/index.css`.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Replace preview rows with richer online list rows that expose play/add/download/context-menu actions.
- Extract board selector and tag selector components once their behavior is stable.
- Continue reducing direct legacy online SDK imports by moving Node-facing request work into Electron-safe adapters.
