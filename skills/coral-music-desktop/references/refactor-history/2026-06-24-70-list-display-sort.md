# Step 70: Local List Display Sort

## Summary

- Continued Step 11 after Step 69 copy/move support.
- Added the first React display-level sorting surface for the local list route.
- Updated `component-migration-plan.md` so completed sorting work is not repeated in later batches.

## Changes

- Updated `src/renderer-react/features/list/LocalListRoutePanel.tsx`.
- Added sort field and direction state.
- Added sort controls for:
  - name,
  - singer,
  - album,
  - source,
  - duration.
- Sorting runs over the current filtered result set, so search and sort compose predictably.
- Selected music operations now use the visible sorted order for selected items.
- The preview list now renders `sortedMusics`.

## Boundaries

- This is display sorting only.
- It does not persist list order.
- It does not migrate the legacy sort modal, drag reorder, context menu actions, duplicate handling, or import/open list flows.

## Validation

- `npx eslint src/renderer-react/features/list/LocalListRoutePanel.tsx`
- `npm run typecheck:react`
- `npm run lint`
- `npm run build:renderer`
- `npm run build`

## Next Plan

1. Add persistent sort/reorder actions or a compatibility bridge if the existing IPC exposes enough list order operations.
2. Port List context menu actions in React.
3. Port duplicate detection and import/open list flows.
4. Delete `src/renderer/views/List` only after the React route covers those remaining workflows and full validation passes.
