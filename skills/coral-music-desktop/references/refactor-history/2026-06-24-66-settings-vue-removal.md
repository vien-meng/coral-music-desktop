# Step 66: Settings Vue Removal

## Context

Steps 30-45 migrated the Settings Route in multiple batches: common/playback/play-detail/desktop lyric/list/download/search/network/update, sync, ODC, OpenAPI, User API, backup, hotkey, theme selector/editor, dislike rules, play-timeout, other, and about surfaces. Step 65 made the active React/Vite lint baseline pass.

## Changes

- Removed the completed legacy Settings Vue module:
  - `src/renderer/views/Setting`
- Updated `SettingRoute` to stop showing the removed legacy path and mark the route as migrated.
- Updated `component-migration-plan.md`:
  - current Vue inventory is now 76 files;
  - Step 13 is marked completed and cleaned;
  - Settings removal is no longer listed as the next batch.

## Validation

- `npm run lint`
- `npm run typecheck:react`
- `npm run build:renderer`
- `npm run build`

## Boundaries

- This removed the legacy Settings Vue module only.
- Shared settings services/stores and React components remain active.
- Remaining Vue cleanup should continue by module: List, Download, material online list, common sound-effect/download modal surfaces, and PlayDetail/PlayBar after their parity gaps close.

## Next Plan

1. Continue with List route mutation parity and remove old List Vue modules after drag/reorder/context-menu parity.
2. Port common download modal and sound-effect surfaces before deleting `src/renderer/components/common`.
3. Finish PlayDetail fullscreen event sync and lyric scroll-sync parity before deleting old player detail Vue modules.
