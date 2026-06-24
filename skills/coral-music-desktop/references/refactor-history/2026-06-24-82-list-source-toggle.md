# Step 82: List Source Toggle

Date: 2026-06-24

## Summary

- Continued List route parity after sorting cleanup.
- Added a React source-toggle flow for current-list songs.
- The row "切换来源" action opens an online candidate search modal and replaces the original song in-place.
- Duplicate candidate targets are guarded with a confirmation before removing the existing target row.

## Changed Files

- `src/renderer-react/stores/domains/listStore.ts`
  - Added `replaceSelectedListMusic()` to remove the old song, add the selected candidate, move it back to the original position, and update local MobX state.
- `src/renderer-react/features/list/LocalListRoutePanel.tsx`
  - Added source-toggle menu action.
  - Added candidate search through `loadOnlineMusicService().searchMusic(..., 'all')`.
  - Added candidate modal and replacement action.
- `skills/coral-music-desktop/references/component-migration-plan.md`
  - Marked source-toggle candidate search and replace action as covered by React.

## Validation

- Passed: `npx eslint src/renderer-react/features/list/LocalListRoutePanel.tsx src/renderer-react/stores/domains/listStore.ts`
- Passed: `npm run typecheck:react`
- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

1. Run full lint and build validation for Step 82.
2. Re-audit `MusicToggleModal.vue`; if source-toggle parity is sufficient, remove that legacy Vue file in the next cleanup batch.
3. Continue remaining List context menu actions: download, source detail/update, and drag/reorder.
