# Step 79: List Duplicate Review Modal

Date: 2026-06-24

## Summary

- Continued the React migration from Step 78 import/export.
- Upgraded the local-list duplicate removal flow from direct batch deletion to a review modal.
- Kept the legacy duplicate-name normalization rule while making the React UI show each duplicate group, retained row, and removable copies.

## Changed Files

- `src/renderer-react/features/list/LocalListRoutePanel.tsx`
  - Replaced duplicate removal ID collection with `getDuplicateMusicReviewItems()`.
  - Added duplicate review modal state.
  - Added per-copy removal and remove-all-duplicate-copies actions.
  - Displays duplicate group number, normalized duplicate key, source, and album metadata.
- `skills/coral-music-desktop/references/component-migration-plan.md`
  - Marked the first React duplicate review modal as complete.
  - Updated the next batch to focus on List drag/reorder and remaining context menu parity.

## Validation

- Passed: `npx eslint src/renderer-react/features/list/LocalListRoutePanel.tsx`
- Passed: `npm run typecheck:react`
- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

1. Run full lint and build validation for Step 79.
2. Port List drag/reorder parity that is still represented by legacy `views/List/MusicList/components/*`.
3. Port any remaining row/list context menu actions that are still missing in React.
4. Re-audit `src/renderer/views/List` and remove Vue files only after the React List route covers the remaining behavior and full validation passes.
