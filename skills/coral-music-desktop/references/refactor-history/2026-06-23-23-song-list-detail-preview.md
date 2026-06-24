# 2026-06-23 Step 23 - Song List Detail Preview

## Scope

- Made the React Song List route render loaded song-list detail music instead of only updating hidden store state.
- Reused the online music preview and row-action components from the previous batches.

## Completed

- Added a song-list detail section to `SongListRoutePanel`.
  - Shows the selected song-list title.
  - Supports detail pagination with `OnlinePager`.
  - Renders detail music through `OnlineMusicPreviewList`.
  - Reuses `OnlineMusicRowActions` for play/add actions.
  - Adds a close-detail control.
- Added detail error display in the Song List route panel.
- Adjusted `SongListStore.hasListDetail` so closing the detail panel actually hides it.
- Added detail layout CSS.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Promote the detail section into a dedicated feature component if it grows further.
- Add the same row-action surface to any future full `OnlineList` replacement.
- Continue with download task creation migration or route component extraction.
