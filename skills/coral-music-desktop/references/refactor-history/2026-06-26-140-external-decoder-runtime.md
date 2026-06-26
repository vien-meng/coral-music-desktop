# Step 140: External Decoder Runtime

Date: 2026-06-26

## Summary

- Added a typed main-process runtime boundary for external local-audio decoding.
- Split local playback resolution between native browser formats and external-decoder-only formats.
- Added a real FFmpeg adapter that transcodes external formats to temporary WAV files for the existing HTML audio runtime.

## Changes

- Added `ExternalDecoderTranscodeParams` and `ExternalDecoderTranscodeResult` to the shared playback capability contract.
- Added `winMain_external_decoder_transcode` IPC wiring through shared contracts, renderer service, and the main window renderer event module.
- Added `externalDecoderRuntime.ts` in the main process with file validation, timeout handling, safe `spawn` args, FFmpeg WAV transcoding, and failed-output cleanup.
- Extended external decoder provider settings to support `ffmpeg` in addition to `none` and `foobar2000`.
- Settings now defaults the external decoder toggle to FFmpeg, labels the executable path generically, and keeps Foobar2000 component directory configuration available.
- `musicUrlResolver` now sends native local formats directly to the HTML audio runtime and routes DSD/SACD-style extensions through the external decoder path.
- Foobar2000 runtime playback now returns an explicit actionable error instead of pretending a stable headless converter path exists.

## Verification

- `npm run typecheck:react`
- `npm run build:main`
- `git diff --check`

## Next Plan

1. Step 141: add focused playback capability smoke for local import/playback, fake decoder adapter probing, and User API plugin rollback.
2. Step 142: tighten decoded-file cleanup and Settings/player status hints around external decoder failures.
