# Step 68: List Search Filter

## Context

Step 67 moved the React List route from a small preview into a full selected-list surface with row selection and batch remove. The next low-risk parity item was the old list search entry (`SearchList.vue` / `useSearch.js`).

## Changes

- Added current-list search/filter input to `LocalListRoutePanel`.
- Filters by:
  - song name;
  - singer;
  - album name;
  - source.
- Added count status:
  - total songs;
  - filtered song count while searching;
  - selected count remains visible.
- Updated select-all behavior to operate on the filtered result set.
- Selection is pruned when the underlying selected list changes.

## Validation

- `npx eslint src/renderer-react/features/list/LocalListRoutePanel.tsx`
- `npm run typecheck:react`
- `npm run lint`
- `npm run build:renderer`
- `npm run build`

## Boundaries

- This is client-side filtering for the currently loaded list.
- It does not yet port full old search highlight behavior, sort modals, drag/reorder, or move-to-list flows.

## Next Plan

1. Port move-to-list/add-to-list workflows.
2. Add music sort and list sort surfaces.
3. Add context menu parity after the command set is stable.
