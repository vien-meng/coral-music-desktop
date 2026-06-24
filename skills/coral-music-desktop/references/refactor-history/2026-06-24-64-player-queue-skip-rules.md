# Step 64: Player Queue Skip Rules

## Context

Step 63 persisted discovered alternate-source candidates. The next player-runtime gap was queue selection parity: React-owned next/previous navigation did not yet consider disliked music, static invalid items, or random-mode played history.

## Changes

- Injected `DislikeStore` into `PlayerStore`.
- Added React queue filtering before next/previous selection:
  - skip disliked online/local/download items through the existing dislike rule matcher;
  - skip incomplete download tasks;
  - skip `.ape` completed download files, matching the current local runtime limitation;
  - skip local music with an empty `filePath`.
- Added random-mode played history:
  - records played item IDs when random mode is active;
  - avoids repeating played queue items until candidates are exhausted;
  - resets history when queue identity changes, when auto-clean is enabled for queue replacement, or when play mode changes.
- Kept manual previous/next behavior aligned with the existing React play-mode override path.

## Validation

- `npx eslint src/renderer-react/stores/rootStore.ts src/renderer-react/stores/domains/playerStore.ts`
- `npm run typecheck:react`
- `npm run build:renderer`
- `npm run build`
- Follow-up cleanup in Step 65 made full `npm run lint` pass.

## Boundaries

- This is a conservative React-side queue filter, not a full port of the legacy worker `filterMusicList`.
- Runtime URL failures are still handled by the player runtime and resolver path.
- Full list mutation, played-list persistence, and worker-equivalent candidate scoring remain future work.

## Next Plan

1. Add full worker-equivalent queue filtering only after list mutation state is fully React-owned.
2. Keep invalid URL retry/auto-skip behavior in the runtime layer.
3. Continue with legacy Vue cleanup only for modules whose React replacement is already built and verified.
