# 2026-06-23 Step 16 - Search Store Service Wiring

## Scope

- Wired `SearchStore` to the new `onlineMusicService`.
- Kept the route UI as a store-backed placeholder while adding real search actions underneath.

## Completed

- Added `SearchStore.submitSearch()` for music and song-list search.
- Added search loading/error state.
- Added result-key handling to avoid stale async results overwriting newer searches.
- Added result reset and no-item label helpers.
- Initialized available search sources from `onlineMusicService`.
- Updated the Search route placeholder to show loading/error state.
- Added `src/renderer/utils/musicSdk/runtimeState.js` so the legacy online SDK no longer imports the full Vue renderer store when bundled from React.
- Repointed the legacy SDK/request imports that conflicted with the new `@renderer` alias.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`
- Note: renderer build now includes the legacy online SDK path and reports the existing Vite externalization/chunk-size warnings; follow-up should split online service code before making it first-screen code.

## Next Plan

- Wire `SongListStore` to `onlineMusicService` for tags, list pages, and detail pages.
- Wire `LeaderboardStore` to `onlineMusicService` for boards and board detail pages.
- Add small React controls for triggering search once the service-backed store passes bundle validation.
