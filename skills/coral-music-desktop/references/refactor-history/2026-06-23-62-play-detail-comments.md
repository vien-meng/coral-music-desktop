# 2026-06-23 Step 62: Play Detail Comments

## Context

Step 61 added full lyric selection/copy mode to React Play Detail. The last major Play Detail UI island from the legacy Step 8 list was `MusicComment`, which depends on online SDK comment APIs rather than IPC.

## Changes

- Added `musicCommentService`.
  - Dynamically imports the legacy online music SDK.
  - Keeps the SDK boundary out of React components.
  - Normalizes hot/new comment pages and nested replies into React-facing types.
  - Preserves the old two-retry behavior for transient comment request failures.
- Added `MusicCommentPanel`.
  - Provides hot/latest comment tabs.
  - Supports refresh, close, pagination, loading, empty, unavailable, and retry states.
  - Renders avatars, user/time/location metadata, liked count, text, and the first reply items.
- Updated `PlayerStore`.
  - Added comment panel open/close/toggle state.
  - Keeps comment and lyric-selection modes mutually exclusive.
  - Closes comment state when Play Detail closes.
- Updated `PlayDetailOverlay`.
  - Added a comment toggle action to the extra controls.
  - Switches the center panel between comments, lyric selection, and compact lyric preview.
- Added CSS for the React comment panel and nested reply preview.

## Validation

- `npx eslint src/renderer-react/components/player/MusicCommentPanel.tsx src/renderer-react/components/player/PlayDetailOverlay.tsx src/renderer-react/stores/domains/playerStore.ts src/renderer-react/services/musicCommentService.ts` passed.
- `npm run typecheck:react` passed.
- `npm run build:renderer` passed.
- `npm run build` passed.
- `npm run lint` still fails on the known 753 historical errors outside this batch; this batch did not increase the current baseline.

## Boundaries

- Comment fetching still relies on the legacy online SDK implementation.
- The panel was build/type verified but not manually smoked against live comment endpoints.
- The first React comment panel does not implement image preview modals or deep reply pagination.
- Source-toggle persistence, dislike/played-history filtering, and invalid-file skip rules remain pending.

## Next Plan

1. Persist other-source fallback metadata when the React runtime discovers playable alternate sources.
2. Add played-history/dislike/invalid-file skip rules after list state is sufficiently migrated.
3. Add fullscreen-change event sync only if a reliable main-process renderer event is introduced.
4. Defer full lyric scroll-sync parity until the player runtime state is more complete.
