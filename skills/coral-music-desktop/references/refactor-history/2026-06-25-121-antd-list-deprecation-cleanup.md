# Step 121: Ant Design List Deprecation Cleanup

## Summary

- Removed migrated React usage of Ant Design `List`, `List.Item`, and `List.Item.Meta`.
- Added a small `PlainList` base component to preserve the current compact row/action layout without triggering Ant Design v6 `List` deprecation warnings.
- Added a migration smoke guard so deprecated AntD List usage does not return in React/lyric migrated panels.

## Changes

- Added `src/renderer-react/components/base/PlainList.tsx`:
  - `PlainList`
  - `PlainListItem`
  - `PlainListMeta`
  - optional loading, empty state, and pagination support.
- Exported the new base list from `src/renderer-react/components/base/index.ts`.
- Added CSS for `.coral-plain-list*` row, action, meta, empty, and pagination layout.
- Replaced AntD `List` usage in:
  - `src/renderer-react/components/player/MusicCommentPanel.tsx`
  - `src/renderer-react/components/player/BatchDownloadModal.tsx`
  - `src/renderer-react/features/online/OnlineControls.tsx`
  - `src/renderer-react/features/online/OnlinePreviewList.tsx`
  - `src/renderer-react/features/download/DownloadRoutePanel.tsx`
  - `src/renderer-react/features/list/LocalListRoutePanel.tsx`
  - `src/renderer-react/features/settings/SettingsRoutePanel.tsx`
- Extended `build-config/smoke-migration.js` with a deprecated AntD List absence check.

## Verification

- `rg "import \\{[^\\n]*\\bList\\b|List as AntList|<List|<AntList|List\\.Item|AntList\\." src/renderer-react src/lyric-react` has no matches.
- `npm run typecheck:react` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `npm run smoke:release` passed.
- `npm run smoke:migration` passed after adding the no-AntD-List guard.

## Notes

- The known build warnings are now limited to the music SDK static/dynamic import warning and chunk-size warnings.
- Main renderer chunk size after this cleanup is about 1.527 MB, slightly lower than the Step 119 build.

## Next Plan

1. Step 122: resolve the music SDK static/dynamic import warning by moving heavyweight SDK consumers behind consistent lazy service boundaries.
2. Step 123: continue bundle-size cleanup and decide whether lyric renderer code splitting is worth a separate pass.
