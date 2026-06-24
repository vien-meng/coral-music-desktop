# Step 67: List Bulk Selection

## Context

After Settings Vue removal, the next cleanup target is `src/renderer/views/List`. React List already supported list select/create/rename/delete plus single-song play/remove/clear, but the route still showed only the first 12 songs and had no batch operation foundation.

## Changes

- Updated `LocalListRoutePanel` to render the full selected list instead of a 12-song preview.
- Added local music selection state:
  - per-row checkbox;
  - select all / clear all toggle;
  - selected count tag.
- Added batch actions:
  - play selected songs as a temporary React queue;
  - remove selected songs with confirmation.
- Added `ListStore.removeMusicsFromSelectedList(ids)` and refactored single remove through the batch path.

## Validation

- `npx eslint src/renderer-react/features/list/LocalListRoutePanel.tsx src/renderer-react/stores/domains/listStore.ts`
- `npm run typecheck:react`
- `npm run lint`
- `npm run build:renderer`
- `npm run build`

## Boundaries

- This does not yet port drag/reorder, move-to-list, duplicate detection, import/open list, or sort modals.
- The old `src/renderer/views/List` remains until those workflows are replaced and smoke-tested.

## Next Plan

1. Add list search/filter and song count/status metadata in the React List route.
2. Port move-to-list / add-to-list workflows on top of typed list IPC.
3. Add list and music sort surfaces before deleting the old List Vue module.
