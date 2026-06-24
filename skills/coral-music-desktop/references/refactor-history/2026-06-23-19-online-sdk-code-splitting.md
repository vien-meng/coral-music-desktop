# 2026-06-23 Step 19 - Online SDK Code Splitting

## Scope

- Moved the legacy online SDK path behind a dynamic import boundary.
- Reduced first-screen renderer bundle pressure introduced by wiring Search/SongList/Leaderboard stores.

## Completed

- Added `src/renderer-react/services/onlineMusicServiceLoader.ts`.
- Changed `SearchStore`, `SongListStore`, and `LeaderboardStore` to load `onlineMusicService` only when actions run.
- Added conservative default online source lists so route placeholders remain usable before the service chunk loads.
- Exported the loader from `src/renderer-react/services/index.ts`.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

Notes:

- The renderer output now keeps the legacy online SDK in a separate lazy chunk:
  - `dist/assets/onlineMusicService-BtcgLRRK.js` around 573 kB.
  - `dist/assets/index-B8D7LfFg.js` around 765 kB.
- Vite still reports browser externalization warnings for Node-facing modules pulled by the legacy SDK path. Those warnings are contained behind the new lazy service boundary and should be reduced by later Electron-safe adapters.

## Next Plan

- Add minimal route-level controls to trigger search/song-list/leaderboard store actions.
- Start extracting React base/common components needed by online routes.
- Continue isolating legacy SDK Node dependencies behind Electron-safe adapters.
