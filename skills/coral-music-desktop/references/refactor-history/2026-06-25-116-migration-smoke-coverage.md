# Step 116: Migration Smoke Coverage

## Summary

- Continued immediately after Step 115 download runtime smoke.
- The project has no existing Vitest/Jest/Playwright test harness, so this step added a no-new-dependency migration smoke command first.
- The new smoke focuses on high-signal migration regressions: React route wiring, online service exports, MobX panel wiring, typed download IPC/runtime/store wiring, and absence of deleted Vue/renderer bridge references.

## Changes

- Added `build-config/smoke-migration.js`.
  - Checks that no `.vue` files remain under `src`.
  - Checks `routeConfig.tsx` still wires all active routes to React panels.
  - Checks online route services expose search, song-list, and leaderboard APIs.
  - Checks migrated panels use `rootStore` and key store methods for search, song-list, leaderboard, local-list, and download.
  - Checks download task IPC names/contracts, main runtime handlers, renderer service, and download store runtime binding.
  - Checks `npm run smoke:download` remains available.
  - Checks React and lyric renderers do not reference `window.coral.worker`, `@renderer/`, or deleted `src/renderer` paths.
- Added `npm run smoke:migration`.
- Updated `component-migration-plan.md` to move the next batch to Step 117 bundle warning cleanup, Step 118 polish, Step 119 release readiness, and Step 120 optional UI automation.

## Verification

- `npm run smoke:migration`: passed.
- `npm run typecheck:react`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- Step 115's `npm run smoke:download`: passed before this step and remains covered by the migration smoke command availability check.

## Remaining Risks

- `smoke:migration` is static structure coverage, not a browser click-through.
- Runtime download behavior is covered by `smoke:download`; route data fetching still depends on live SDK/source behavior and should be manually or UI-smoke verified before release.
- Production build still reports non-blocking renderer warnings from Node-oriented dependencies.

## Next Step

- Step 117: reduce renderer bundle warnings from Node-only request/logging dependencies:
  - identify why `needle/tunnel/electron-log/electron` enter the renderer bundle,
  - split or bridge Node-only request paths,
  - keep music SDK source behavior intact,
  - rerun `smoke:migration`, `smoke:download`, `lint`, `typecheck:react`, and `build`.
