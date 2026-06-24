# Step 85: List Source Detail Action

Date: 2026-06-24

## Summary

- Continued List route parity after source-toggle cleanup.
- Added a React "查看详情" row action that opens the song detail page in the external browser using the legacy `musicSdk.getMusicDetailPageUrl` path.
- Created `src/renderer-react/services/musicDetailService.ts` as a thin wrapper around the old musicSdk + `appService.openUrl`.

## Changed Files

- `src/renderer-react/services/musicDetailService.ts`
  - New file: wraps `musicSdk[source].getMusicDetailPageUrl(musicInfo)` and `appService.openUrl(url)`.
- `src/renderer-react/features/list/LocalListRoutePanel.tsx`
  - Added `handleOpenSourceDetail` menu handler.
  - Added "查看详情" dropdown menu item (disabled for local sources).

## Validation

- Passed: `npx eslint src/renderer-react/features/list/LocalListRoutePanel.tsx src/renderer-react/services/musicDetailService.ts`
- Passed: `npm run typecheck:react`
- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`
- Note: Build added an `INEFFECTIVE_DYNAMIC_IMPORT` warning because `musicDetailService.ts` statically imports `musicSdk`, but the chunk behavior is unaffected.

## Next Plan

1. Continue List migration with download row action and download-modal parity.
2. After download parity, audit and remove more `src/renderer/views/List` Vue files that are now fully covered.
3. Keep drag/reorder as a dedicated interaction batch.
