# 2026-06-23 Step 14 - Route Store Placeholders

## Scope

- Connected the React route placeholders to the new MobX domain stores.
- Fixed the route outlet after `activeRoute` moved from `SettingsStore` to `UiStore`.

## Completed

- Updated `src/renderer-react/app/router.tsx` to read `rootStore.ui.activeRoute`.
- Replaced static placeholder route content with observer components that read store state.
- Added live route metrics for Search, SongList, Leaderboard, local List, Download, and Setting routes.
- Added `SongListStore.activeSource`, `SongListStore.hasListDetail`, and `SyncStore.serverDeviceCount` computed selectors.
- Removed the stale migration dashboard placeholder that still referenced old settings/theme ownership.
- Marked the current computed selector task as complete in the component migration plan.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Extract typed online data services for Search, SongList, and Leaderboard.
- Start replacing the base/common Vue components that route pages depend on.
- Keep route placeholders store-backed until each route has enough real React components to replace them safely.
