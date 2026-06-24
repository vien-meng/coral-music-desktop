# 2026-06-23 Step 55: Player Queue Navigation

## Context

Step 54 made the React runtime able to play local files, online URLs, fallback URLs, and completed download tasks. The PlayBar previous/next buttons still had no React-owned queue context, so transport controls could not move through the visible route results.

## Changes

- Extended `PlayerStore` with React-owned queue state.
  - Added `playQueue`, `currentQueueId`, `currentQueueIndex`, `setQueue()`, `clearQueue()`, and `playFromQueue()`.
  - `playNext()` and `playPrev()` now choose from the active queue before falling back to the runtime bridge.
  - Manual prev/next respects the existing `player.togglePlayMethod` setting for list loop and random behavior; `list`, `singleLoop`, and `none` are normalized to manual list-loop behavior, matching the legacy manual-toggle intent.
- Wired queue-aware play actions.
  - Search music previews pass the current search result page as the active queue.
  - Song-list detail previews pass the current detail page as the active queue.
  - Leaderboard previews pass the current board page as the active queue.
  - Local list previews pass the selected local list preview as the active queue.
  - Download route now exposes a play button for completed tasks and passes completed tasks as the active queue.
- Added `DownloadStore.playableTasks` for completed download playback.

## Validation

- `npx eslint src/renderer-react/stores/domains/playerStore.ts src/renderer-react/stores/domains/downloadStore.ts src/renderer-react/features/online/OnlineMusicRowActions.tsx src/renderer-react/features/search/SearchRoutePanel.tsx src/renderer-react/features/song-list/SongListRoutePanel.tsx src/renderer-react/features/leaderboard/LeaderboardRoutePanel.tsx src/renderer-react/features/list/LocalListRoutePanel.tsx src/renderer-react/features/download/DownloadRoutePanel.tsx` passed.
- `npm run typecheck:react` passed.
- `npm run build:renderer` passed.
- `npm run build` passed.
- `npm run lint` still fails on the existing 806 historical errors outside this batch; this did not increase from the known baseline.

## Boundaries

- Queue scope currently follows the visible preview slice, not the full paged remote result set.
- Auto-advance on audio `ended` is still not wired; previous/next works from explicit PlayBar/PlayDetail controls.
- The legacy played-history de-duplication and dislike filtering are not yet ported.
- Persisted source-toggle metadata remains pending.

## Next Plan

1. Add runtime auto-advance on `ended`, using the same queue selection path.
2. Add a small queue status surface to PlayBar or PlayDetail for current index/count.
3. Expand queue scopes where needed after full list virtualization is migrated.
4. Port Play Detail fullscreen/window chrome parity.
