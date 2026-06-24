# Step 80: List Persistent Sort

Date: 2026-06-24

## Summary

- Continued the List route migration after Step 79 duplicate review parity.
- Added persistent whole-list sorting from the React list route.
- Added random ordering for the selected list.
- Reused the existing typed `list_music_update_position` IPC path, so the operation updates the stored list order instead of only changing the rendered view.

## Changed Files

- `src/renderer-react/stores/domains/listStore.ts`
  - Added `replaceSelectedMusicOrder()` for full-list order replacement.
  - Skips no-op reorder requests when IDs are already in the same order.
- `src/renderer-react/features/list/LocalListRoutePanel.tsx`
  - Extracted current display sorting into `sortMusicInfos()`.
  - Added `shuffleMusicInfos()`.
  - Added "保存排序" and "随机排序" actions wired to the store.
- `skills/coral-music-desktop/references/component-migration-plan.md`
  - Marked persistent whole-list sort/random-sort parity as covered by React.

## Validation

- Passed: `npx eslint src/renderer-react/features/list/LocalListRoutePanel.tsx src/renderer-react/stores/domains/listStore.ts`
- Passed: `npm run typecheck:react`
- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

1. Run full lint and build validation for Step 80.
2. Continue List route parity with remaining context menu actions.
3. Audit whether `MusicSortModal.vue` and `ListSortModal.vue` are now fully covered by React before deleting their legacy Vue files.
4. Keep drag/reorder as a separate batch because it affects pointer behavior and visual list stability.
