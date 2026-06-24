# Step 63: Player Other-Source Cache Persistence

## Context

Step 62 completed the first React Play Detail comments panel. The next player-runtime risk was the source-toggle fallback path: Step 54 could discover alternate provider candidates in memory, but React did not yet reuse the existing persisted `music_info_other_source` cache exposed by the main process.

## Changes

- Added typed React IPC coverage for `get_other_source` and `save_other_source`.
- Added `cacheService.getCachedOtherSource` and `cacheService.saveCachedOtherSource`.
- Updated `musicUrlResolver.fetchOtherSourceMusicList` to:
  - check the persisted other-source cache before calling legacy `musicSdk.findMusic`;
  - keep successful DB reads in the React runtime memory cache;
  - save newly discovered alternate-source candidates back to the DB cache.

## Validation

- `npx eslint src/renderer-react/services/cacheService.ts src/renderer-react/services/playerRuntime/musicUrlResolver.ts`
- `npm run typecheck:react`
- `npm run build:renderer`
- `npm run build`
- `npm run lint` still fails on the known historical baseline: 753 errors, with no increase from this batch.

## Boundaries

- This batch persists discovered fallback candidates only; it does not add a manual source-toggle modal.
- Cache writes are fire-and-forget so playback resolution is not blocked by persistence.
- Runtime smoke testing is still needed inside Electron.
- Played-history filtering, dislike filtering, and invalid-file skip rules are still pending.

## Next Plan

1. Port conservative queue skip rules for disliked tracks and invalid local/download files.
2. Keep manual source-toggle UI and deeper list mutation parity for a later player batch.
3. Revisit fullscreen event sync only if the main process exposes a reliable renderer event.
