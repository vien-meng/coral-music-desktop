# 2026-06-23 Step 56: Player Auto Advance

## Context

Step 55 made explicit previous/next work against a React-owned queue, but audio completion still stopped at the end of the current track. The next player parity gap was to let the `HTMLAudioElement` runtime tell the store when playback ended so the same queue path can choose the next track.

## Changes

- Extended `PlayerRuntimeStatus` with an internal `isEnded` flag.
- Updated `HtmlAudioPlayerRuntimeBackend`.
  - The `ended` media event now publishes `{ status: 'stoped', isEnded: true }`.
  - The existing pause/status events remain unchanged, so normal pause/stop does not auto-advance.
- Updated `PlayerStore`.
  - `applyRuntimeStatus()` calls `playNext(true)` only for `isEnded` statuses.
  - `playNext()` now accepts an internal `isAutoToggle` flag.
  - Manual next keeps the Step 55 behavior that normalizes `list`, `singleLoop`, and `none` to list-loop.
  - Auto next honors the real play mode:
    - `listLoop` wraps,
    - `random` selects randomly,
    - `list` stops at the end,
    - `singleLoop` repeats the current item,
    - `none` stops.

## Validation

- `npx eslint src/renderer-react/services/playerRuntime/types.ts src/renderer-react/services/playerRuntime/htmlAudioRuntime.ts src/renderer-react/stores/domains/playerStore.ts` passed.
- `npm run typecheck:react` passed.
- `npm run build:renderer` passed.
- `npm run build` passed.
- `npm run lint` still fails on the existing 806 historical errors outside this batch; this did not increase from the known baseline.

## Boundaries

- Auto-advance relies on React queue context, so routes without a registered queue still stop after the current track.
- Played-history de-duplication, dislike filtering, and invalid-file skip loops remain pending.
- There is not yet a visual queue index/count on the player UI.

## Next Plan

1. Add queue index/count display to PlayBar and PlayDetail.
2. Add basic queue diagnostics/status text for no-queue and end-of-list cases.
3. Port played-history/dislike filtering once list virtualization and full list state are migrated.
4. Continue Play Detail fullscreen/window chrome parity.
