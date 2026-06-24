# 2026-06-23 Step 17 - SongList Store Service Wiring

## Scope

- Wired `SongListStore` to `onlineMusicService`.
- Kept the route UI as a store-backed placeholder while adding real song-list data actions underneath.

## Completed

- Added song-list loading/error state.
- Initialized song-list sources from `onlineMusicService`.
- Added `loadTags()` for source tags.
- Added `loadList()` for tag/sort/page list loading.
- Added `loadListDetail()` for playlist detail loading.
- Added async result-key checks before applying list/detail results.
- Updated the SongList route placeholder to show loading/error state.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`
- Note: renderer build still reports Node externalization and chunk-size warnings from the legacy online SDK path; this is expected until online code is split or moved behind Electron-safe adapters.

## Next Plan

- Wire `LeaderboardStore` to `onlineMusicService`.
- Add small route-level controls for Search/SongList placeholders after all three online stores are service-backed.
- Plan code splitting for the legacy online SDK path now that it is in the React renderer bundle.
