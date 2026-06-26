# Step 133: Local Audio Metadata Scan

Date: 2026-06-25

## Summary

- Added metadata scanning to the local audio import path without introducing new dependencies.
- Reused the existing `music-metadata` package through a runtime `globalThis.require` boundary, keeping Vite from statically bundling Node-heavy parser code into the renderer entry.
- Metadata read failures now fall back to the Step 132 filename inference path.

## Changes

- Extended `src/renderer-react/services/localAudioService.ts`:
  - lazy runtime loading for `music-metadata`;
  - `readLocalAudioMetadata`;
  - duration formatting;
  - `createLocalMusicInfoWithMetadata`.
- Imported local files now prefer tag title, artist, album, and duration when available.
- Extended `smoke:playback-capabilities` to guard the metadata scan boundary.
- Updated `component-migration-plan.md` so the next major work is the Foobar2000 external decoder probe.

## Verification

- `npm run smoke:playback-capabilities`
- `npm run typecheck:react`
- `npm run lint`
- `npm run smoke:release`

## Next Plan

1. Step 134: add main-process external decoder probe configuration for Foobar2000 paths/plugins.
2. Step 135: implement a controlled decoder/transcode runtime for DSD/SACD and other unsupported local formats.
3. Step 136: polish Coral Music User API source-plugin status and validation.
