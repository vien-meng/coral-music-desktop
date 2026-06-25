# Step 132: Local Audio Import Into React Lists

Date: 2026-06-25

## Summary

- Implemented the first local audio import path in the React list surface.
- Users can select local audio files or directories, recursively collect supported audio files, and add them to the selected list as `MusicInfoLocal` records.
- This step keeps playback on the existing `resolveLocalMusicUrl` boundary for Electron-native formats; DSD/SACD playback still requires the later external decoder adapter.

## Changes

- Added directory helpers to `src/renderer-react/services/nodeBridgeService.ts`.
- Added `src/renderer-react/services/localAudioService.ts`:
  - filters native local audio extensions and external-decoder candidate extensions;
  - recursively scans selected directories;
  - creates `MusicInfoLocal` records with `source: 'local'`, `meta.filePath`, `meta.ext`, and filename-based title/singer inference.
- Added `ListStore.importLocalAudioPaths`.
- Added a “本地音频” action to `LocalListRoutePanel`.
- Extended `smoke:playback-capabilities` to guard the local import service, store wiring, and UI entry.
- Updated `component-migration-plan.md` so the next step is metadata scanning before decoder probing.

## Verification

- `npm run smoke:playback-capabilities`
- `npm run typecheck:react`
- `npm run lint`
- `npm run smoke:release`

## Next Plan

1. Step 133: local metadata scanning and fallback handling.
2. Step 134: Foobar2000 external decoder probe.
3. Step 135: decoder runtime adapter for unsupported local formats.
