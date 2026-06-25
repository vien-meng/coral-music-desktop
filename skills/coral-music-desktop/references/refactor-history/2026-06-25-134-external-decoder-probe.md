# Step 134: External Decoder Probe Boundary

Date: 2026-06-25

## Summary

- Added a typed, non-executing probe for external decoder configuration.
- The probe validates Foobar2000 executable/plugin paths and extension declarations without loading Foobar2000 components or running a transcode.
- This keeps the security/runtime boundary clear before the decoder adapter is implemented.

## Changes

- Extended `src/shared/playbackCapabilities.ts` with `ExternalDecoderProbeParams`, `ExternalDecoderProbePathStatus`, and `ExternalDecoderProbeResult`.
- Added `external_decoder_probe` IPC and typed contract.
- Added `src/main/modules/winMain/externalDecoderProbe.ts`.
- Registered the probe in `winMain/rendererEvent/app.ts`.
- Added `src/renderer-react/services/externalDecoderService.ts`.
- Extended `smoke:playback-capabilities` to guard the non-executing probe boundary.
- Updated `component-migration-plan.md` so Step 135 can move to Settings exposure and decoder runtime adapter work.

## Verification

- `npm run smoke:playback-capabilities`
- `npm run typecheck:react`
- `npm run build:main`
- `npm run lint`
- `npm run smoke:release`

## Next Plan

1. Step 135: expose decoder probe status/path selection in Settings.
2. Step 136: implement decoder runtime/transcode adapter for unsupported local formats.
3. Step 137: add local playback and fake decoder adapter smoke.
