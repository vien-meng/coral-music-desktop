# USB Exclusive Output Plan

Date: 2026-06-30

## Summary

- Added the first implementation layer for USB exclusive output.
- The first supported target is Windows WASAPI Exclusive; macOS and Linux expose a clear unsupported state.
- Existing HTMLAudio/Web Audio playback remains the default system-output path.
- Exclusive output is exposed as a separate player backend and falls back to system output when configured.

## Changes

- Added audio-output capability types to `src/shared/playbackCapabilities.ts`.
- Added app settings for output mode, WASAPI backend, selected exclusive device, fallback behavior, buffer size, and sample-rate policy.
- Added typed IPC channels for exclusive device listing, probing, start, pause, resume, seek, stop, and status events.
- Added a main-process exclusive output service with Windows-only WASAPI gating and a reserved `coral-wasapi-helper.exe` contract.
- Added renderer audio-output service, exclusive player backend, and hybrid backend selection between system and exclusive output.
- Added Settings UI controls for USB exclusive output, device refresh, probing, buffer size, sample-rate policy, and fallback behavior.
- Added `smoke:audio-output-capabilities` to pin the public contract, defaults, Windows gate, runtime boundary, and Settings controls.

## Current Boundary

- The real out-of-process WASAPI helper is not bundled yet.
- On non-Windows platforms, exclusive output reports unsupported.
- On Windows without the helper, Settings probing and playback return an actionable helper-missing message.
- If fallback is enabled, exclusive playback failure hands the same track to the system-output backend.

## Verification

- Run:

```bash
npm run smoke:audio-output-capabilities
npm run check-type
npm run typecheck:react
npm run build:main
npm run smoke:playback-capabilities
```

## Next Plan

1. Implement or bundle the `coral-wasapi-helper.exe` out-of-process helper.
2. Define the helper JSON protocol for list-devices, probe, start, pause, resume, seek, stop, and status.
3. Pipe FFmpeg PCM output into the helper for local, WebDAV proxy, and online URLs.
4. Add Windows USB DAC manual verification once the helper is available.

