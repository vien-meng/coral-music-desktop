# Step 131: Local Audio, External Decoder, And Source Plugin Capability Contract

Date: 2026-06-25

## Summary

- Added the new capability requirements for local audio playback, Foobar2000-style decoder integration, and Coral Music source plugin configuration to the formal migration plan.
- Kept the Foobar2000 requirement behind an external decoder adapter boundary: the project must not directly load Foobar2000 components/DLLs into Electron renderer or main process.
- Preserved the existing Coral Music User API runtime as the source-plugin configuration path instead of introducing a competing plugin system.

## Changes

- Added `skills/coral-music-desktop/references/playback-capability-plan.md`.
- Added `src/shared/playbackCapabilities.ts` with native local audio extensions, external decoder candidate extensions, Foobar2000 plugin hints, extension normalization, and roadmap constants.
- Added conservative AppSetting/default-setting keys for:
  - local audio enablement, scan dirs, and native supported extensions;
  - external decoder provider/path/plugin dirs/output/extensions/timeout;
  - Coral Music User API source-plugin preference flags.
- Added `build-config/smoke-playback-capabilities.js`.
- Added `npm run smoke:playback-capabilities` and included it in `npm run smoke:release`.
- Updated `component-migration-plan.md` so the next steps move to local file import, decoder probing/runtime, and User API plugin polish.

## Verification

- `npm run smoke:playback-capabilities`
- `npm run typecheck:react`
- `npm run lint`
- `npm run smoke:release`

## Next Plan

1. Step 132: implement local file/folder import and metadata scanning into `MusicInfoLocal`.
2. Step 133: add a main-process Foobar2000 external decoder probe.
3. Step 134: add controlled decoder/transcode runtime for unsupported local audio formats.
4. Step 135: polish Coral Music User API source-plugin validation and status display.
5. Step 136: add playback capability smoke with local fixtures and fake adapter probing.
