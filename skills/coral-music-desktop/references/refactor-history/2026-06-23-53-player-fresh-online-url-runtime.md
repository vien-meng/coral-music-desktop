# 2026-06-23 Step 53: Player Fresh Online URL Runtime

## Context

Step 52 made the React player runtime able to play local files and already cached online URLs. The remaining blocker for normal online playback was the fresh URL boundary: React needed to ask the existing music SDK for a playable URL without importing the Vue store/runtime.

## Changes

- Extended `src/renderer-react/services/playerRuntime/musicUrlResolver.ts` with fresh online URL fetching.
  - Loads `src/renderer/utils/musicSdk` through a dynamic import so the larger provider SDK stays out of the first renderer chunk.
  - Converts the new `Coral.Music.MusicInfoOnline` shape into the smaller old SDK payload locally, without importing `@common/utils/tools` or legacy Vue state.
  - Resolves playback in this order: local file URL, cached online URL, fresh provider URL.
  - Writes fresh provider URLs back through the Step 52 typed cache IPC boundary.
- Hardened `src/renderer-react/services/playerRuntime/htmlAudioRuntime.ts`.
  - Handles resolver failures by publishing `status: 'error'`.
  - Keeps the existing request id guard so stale async URL responses cannot replace a newer song.

## Validation

- `npx eslint src/renderer-react/services/playerRuntime/musicUrlResolver.ts src/renderer-react/services/playerRuntime/htmlAudioRuntime.ts src/renderer-react/services/cacheService.ts src/renderer-react/services/playerService.ts` passed.
- `npm run typecheck:react` passed.
- `npm run build:renderer` passed.
  - The fresh provider SDK is emitted as a lazy chunk (`musicSdk-*.js`) instead of being folded into the main renderer chunk.
- `npm run build` passed.
- Full `npm run lint` was already known to fail on 806 historical errors outside this batch; the Step 53 touched files pass targeted lint.

## Boundaries

- Playback quality currently defaults to the runtime resolver fallback path because React settings are not wired into `resolvePlayableMusicUrl()` yet.
- Source toggle/retry and provider fallback behavior are still not ported.
- Download-task playback URL resolution is still not ported.
- Playlist-aware previous/next is still a placeholder in the runtime backend.
- Play-detail fullscreen chrome parity, lyric menu/selection, and comments remain pending.

## Next Plan

1. Port source toggle/retry behavior and API readiness handling around online URL fetching.
2. Add download-task playback URL resolution behind the same runtime resolver.
3. Port playlist-aware previous/next into `PlayerRuntimeBridge`.
4. Continue Play Detail parity with fullscreen/window chrome controls.
5. Port lyric menu/selection and comments after the player runtime stabilizes.
