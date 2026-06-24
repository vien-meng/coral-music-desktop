# 2026-06-23 Step 54: Player URL Fallback And Download Runtime

## Context

Step 53 gave the React player runtime fresh current-source online URL fetching. The next runtime gap was parity with the legacy URL boundary: completed download tasks should play their local files first, and online playback should have a conservative other-source fallback when the current source cannot provide a URL.

## Changes

- Extended `PlayerRuntimeBridge.playMusic()` with `PlayerRuntimeMusicInfo`, allowing the runtime to accept either `LX.Music.MusicInfo` or `LX.Download.ListItem`.
- Extended `musicUrlResolver`.
  - Added completed download-task path resolution through `metadata.filePath`.
  - Falls back from download tasks to `metadata.musicInfo` online URL resolution when no completed local file is available.
  - Added a local old-SDK-result to `LX.Music.MusicInfoOnline` converter for `musicSdk.findMusic()` fallback results, avoiding imports from legacy Vue utilities.
  - Added in-memory other-source lookup de-duplication/cache.
  - Added optional `allowToggleSource` and `onToggleSource` resolver hooks.
  - Keeps too-many-requests errors as hard failures instead of retrying across providers.
- Updated `HtmlAudioPlayerRuntimeBackend`.
  - Accepts download tasks as playable runtime inputs.
  - Publishes the resolved fallback music metadata after URL resolution so UI state does not drift from the audio source.
- Updated `playerService` and `PlayerStore`.
  - Download tasks are routed only to the React audio backend, not the legacy play IPC channel.
  - Store display getters read download task metadata through `displayMusicInfo`.

## Validation

- `npx eslint src/renderer-react/services/playerRuntime/musicUrlResolver.ts src/renderer-react/services/playerRuntime/htmlAudioRuntime.ts src/renderer-react/services/playerRuntime/types.ts src/renderer-react/services/playerService.ts src/renderer-react/stores/domains/playerStore.ts` passed.
- `npm run typecheck:react` passed.
- `npm run build:renderer` passed.
  - Renderer still keeps the provider SDK in a lazy `musicSdk-*.js` chunk.
- `npm run build` passed.
- `npm run lint` still fails on the existing 806 historical errors outside this batch; this did not increase from the known baseline.

## Boundaries

- The resolver can publish fallback metadata, but it does not yet persist `meta.toggleMusicInfo` back into local list/download records.
- Download path fallback currently checks `metadata.filePath`; grouped save-path reconstruction from legacy `buildSavePath()` remains pending.
- `allowToggleSource` is available in the resolver API but the React UI/settings do not expose a source-toggle preference yet.
- Playlist-aware previous/next remains a runtime placeholder.
- Play-detail fullscreen chrome parity, lyric menu/selection, and comments remain pending.

## Next Plan

1. Port playlist-aware previous/next selection into `PlayerRuntimeBridge`.
2. Add queue context to `PlayerStore` so route panels can register the active list/download queue before playback.
3. Wire download route play buttons to the widened `playMusic()` runtime input.
4. Persist fallback source information back into list/download data after list mutation boundaries are ready.
5. Continue Play Detail parity with fullscreen/window chrome controls.
