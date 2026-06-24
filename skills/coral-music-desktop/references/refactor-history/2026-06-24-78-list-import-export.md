# Step 78: Local List Import Export

## Summary

- Continued Step 11 after the cleanup audit.
- Added React-side current-list import/export for legacy list-part files.
- Kept the first import workflow conservative: import always creates a user list and avoids overwriting existing default/love/user lists.

## Changes

- Updated `src/renderer-react/services/appService.ts`.
  - Added `showSaveDialog()`.
- Updated `src/renderer-react/services/listService.ts`.
  - Added `exportListPart(filePath, listInfo, musicInfos)`.
  - Added `importListPartAsUserList(filePath, userLists, position, addMusicLocationType)`.
  - Supports `playListPart` and `playListPart_v2`.
  - Normalizes legacy music info through common migration helpers.
  - Avoids ID collisions by suffixing imported list IDs when needed.
- Updated `src/renderer-react/stores/domains/listStore.ts`.
  - Added `exportSelectedListPart(filePath)`.
  - Added `importListPart(filePath, addMusicLocationType)`.
- Updated `src/renderer-react/features/list/LocalListRoutePanel.tsx`.
  - Added `导入列表` and `导出列表`.

## Validation

- `npx eslint src/renderer-react/services/appService.ts src/renderer-react/services/listService.ts src/renderer-react/stores/domains/listStore.ts src/renderer-react/features/list/LocalListRoutePanel.tsx`
- `npm run typecheck:react`
- Full project validation will run after this history entry.

## Boundaries

- Import does not overwrite an existing list yet.
- Import does not target default/love lists yet.
- Export is for the currently selected user list.
- `src/renderer/views/List` remains until drag/reorder, remaining menu actions, and duplicate review parity are done.

## Next Plan

1. Add duplicate review modal parity.
2. Port remaining low-risk context menu actions.
3. Decide whether drag-and-drop reorder is required before deleting the old List view.
