# Step 122: Music SDK Lazy Boundary

## Summary

- Resolved the renderer build warning where `musicSdk/sdk` was both statically and dynamically imported.
- Moved the remaining static SDK consumers behind lazy service boundaries.
- Added a migration smoke guard to prevent static SDK imports from returning in React service modules.

## Changes

- Updated `src/renderer-react/services/onlineMusicService.ts`:
  - removed the static `musicSdk` import,
  - added a cached dynamic SDK loader,
  - made source and sort discovery async,
  - updated search/song-list/leaderboard calls to await SDK lookup.
- Updated stores to await async source/sort discovery:
  - `src/renderer-react/stores/domains/searchStore.ts`
  - `src/renderer-react/stores/domains/songListStore.ts`
  - `src/renderer-react/stores/domains/leaderboardStore.ts`
- Updated `src/renderer-react/services/musicDetailService.ts`:
  - removed the static SDK import,
  - added cached dynamic SDK loading for detail-page URL lookup.
- Extended `build-config/smoke-migration.js` with a guard that fails if React service modules statically import `musicSdk/sdk`.

## Verification

- `npm run typecheck:react` passed.
- `npm run lint` passed.
- `npm run build:renderer` passed.
- `npm run build` passed.
- `npm run smoke:migration` passed.
- `npm run smoke:release` passed.

## Build Result

- The previous `INEFFECTIVE_DYNAMIC_IMPORT` warning for `musicSdk/sdk` is gone.
- Renderer output now includes an independent SDK chunk:
  - `sdk-*.js` around 222 KB.
- Main renderer chunk dropped from about 1.527 MB after Step 121 to about 1.305 MB.
- Remaining Vite warnings are only chunk-size warnings for renderer and lyric surfaces.

## Next Plan

1. Step 123: continue bundle-size review, focusing on route-level lazy loading and lyric renderer chunk pressure.
2. Step 124: retry packaged `pack:dir` after Electron runtime cache/download is stable.
3. Step 125: revisit UI click-through automation once dev/runtime environment is predictable.
