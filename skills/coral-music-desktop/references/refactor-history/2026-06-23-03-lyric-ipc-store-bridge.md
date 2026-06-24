# 2026-06-23 Refactor History: Lyric IPC Store Bridge

## Scope

Started Step 4 of the component migration plan: desktop lyric renderer IPC, service, store, and shell bridge.

## Completed

- Extended `src/shared/ipc/contracts.ts` with typed `winLyric` channels.
- Added `src/lyric-react/services/ipc/client.ts`.
- Added `src/lyric-react/services/lyricWindowService.ts`.
- Replaced the placeholder `src/lyric-react/stores/lyricRootStore.ts` with a MobX store that:
  - hydrates desktop lyric config from `winLyric_get_config`,
  - listens for `winLyric_on_config_change`,
  - requests and binds the `MessageChannelMain` port,
  - receives main-window lyric/music/playback actions,
  - persists lock and direction updates through `winLyric_set_config`,
  - forwards mouse enter/leave state through the legacy hover-hide IPC.
- Updated `src/lyric-react/App.tsx` to render config-backed lock/direction controls, connection state, music metadata, and current/next lyric lines.
- Updated `src/lyric-react/styles/index.css` to use lyric color CSS variables from migrated config.

## Current Status

- Desktop lyric React surface has the connection and state foundation needed before porting the full lyric timeline and layout components.
- `src/renderer-lyric` remains as a behavior reference; no Vue files were deleted in this batch.
- Legacy Vue SFC count remains 122.

## Validation

Passed for this batch:

- `npm run build:renderer-lyric`
- `npm run lint`
- `npm run build`
- `rg -n "@lyric|renderer-lyric|@renderer/utils/ipc|src/renderer" src/lyric-react src/shared` returned no matches.

Notes:

- The lyric renderer still shows Vite chunk-size warnings because Ant Design is still bundled into the placeholder shell.
- Runtime Electron smoke for actual main-window/lyric-window reconnect still needs to be performed after the lyric timeline and layout components are migrated.

## Next Plan

1. Move lyric timeline behavior from `src/renderer-lyric/core/lyric.ts` into `src/lyric-react/services/lyricTimeline.ts`.
2. Port `LyricHorizontal` and `LyricVertical` into React components that consume `LyricRootStore`.
3. Port `ControlBar`, resize/drag handling, pause-hide, hover-hide, and audio visualization.
