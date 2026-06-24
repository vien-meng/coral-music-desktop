# 2026-06-23 Step 57: Player Queue Status

## Context

Step 55 and Step 56 introduced React-owned queues and audio-ended auto-advance. The player surfaces still had no visible sign that a queue was active, making smoke checks harder.

## Changes

- Added `PlayerStore.queuePositionText`.
  - Returns a compact `current / total` label when the current track is part of the active queue.
  - Returns an empty string when there is no active queue or the current item is not in it.
- Updated `PlayBar`.
  - The subtitle now combines singer/status text with queue position when available.
- Updated `PlayDetailOverlay`.
  - The detail metadata block shows the same queue position under album metadata.
- Added compact queue styling for Play Detail.

## Validation

- `npx eslint src/renderer-react/stores/domains/playerStore.ts src/renderer-react/components/player/PlayBar.tsx src/renderer-react/components/player/PlayDetailOverlay.tsx` passed.
- `npm run typecheck:react` passed.
- `npm run build:renderer` passed.
- `npm run build` passed.
- `npm run lint` still fails on the existing 806 historical errors outside this batch; this did not increase from the known baseline.

## Boundaries

- Queue status is intentionally compact and does not expose a full queue drawer.
- Queue scope still follows the currently visible preview slice for online routes.
- Played-history/dislike filtering remains pending.

## Next Plan

1. Port Play Detail fullscreen/window chrome controls.
2. Add basic no-queue/end-of-list status text only if it does not create noisy UI.
3. Persist source-toggle fallback metadata after mutation boundaries are stable.
4. Port lyric menu/selection behavior.
