# Step 146: FLAC Runtime Fallback

Date: 2026-06-26

## Summary

- Fixed FLAC playback failing with `Failed to load because no supported source was found`.
- Replaced the hard-coded "native extension means playable" assumption with runtime capability probing plus bundled FLAC decoding.

## Changes

- Added runtime `Audio.canPlayType()` probing for local native audio extensions.
- Added FLAC MIME candidates so the renderer can detect whether the current Electron runtime can actually play FLAC.
- Added `@wasm-audio-decoders/flac` as a focused dependency for local FLAC fallback decoding.
- Added `localAudioDecodeService`, which decodes FLAC bytes to PCM and wraps them in an in-memory WAV Blob URL for the existing `<audio>` runtime.
- Local FLAC now plays natively only when the runtime supports it; otherwise it uses the bundled FLAC decoder.
- Completed downloaded FLAC files use the same native-or-bundled-decoder playback path.
- Object URLs created for decoded local files are revoked on track changes, stale requests, and runtime dispose.

## Verification

- `npm run typecheck:react`
- `npm run smoke:playback-capabilities`
- `npm run build:renderer`
- `git diff --check`

## Next Plan

1. Verify the FLAC file path in a stable app window and confirm whether it plays natively or through the bundled FLAC decoder on the current machine.
2. Continue focused visual polish on Settings/List/PlayBar.
