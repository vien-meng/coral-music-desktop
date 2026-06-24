# Step 72: Local List Duplicate Removal

## Summary

- Continued Step 11 after persistent selected-song reorder.
- Added a React duplicate-detection and batch-removal path for the local list route.
- Reused the existing `removeListMusics` IPC path through `ListStore.removeMusicsFromSelectedList()`.

## Changes

- Updated `src/renderer-react/features/list/LocalListRoutePanel.tsx`.
- Added the legacy duplicate-name normalization rule:
  - strip parenthesized variants,
  - strip punctuation and spacing,
  - fall back to whitespace removal.
- Added duplicate-group detection over the currently loaded list.
- Added an `移除重复` action.
- The action keeps the first item in each duplicate-name group and removes later duplicate copies after confirmation.

## Validation

- `npx eslint src/renderer-react/features/list/LocalListRoutePanel.tsx`
- `npm run typecheck:react`
- `npm run lint`
- `npm run build:renderer`
- `npm run build`

## Boundaries

- This is the first duplicate-removal workflow, not full modal parity.
- It does not show each duplicate group in a review list yet.
- It does not implement per-item duplicate preview/play/remove actions from the legacy modal.
- It keeps `src/renderer/views/List` until full context menus, import/open list, and review parity are covered.

## Next Plan

1. Port full context menu actions into React toolbar/dropdown controls.
2. Add duplicate review modal parity if users need to inspect every duplicate before removal.
3. Port import/open list flows.
4. Re-evaluate whether `src/renderer/views/List` can be deleted after those flows are validated.
