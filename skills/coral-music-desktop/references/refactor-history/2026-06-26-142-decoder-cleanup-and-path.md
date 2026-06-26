# Step 142: Decoder Cleanup And PATH Support

Date: 2026-06-26

## Summary

- Improved the external decoder runtime ergonomics after the first FFmpeg adapter.
- Added cleanup for decoded temporary WAV files.
- Allowed FFmpeg to be resolved from `PATH` with the default `ffmpeg` command.

## Changes

- `ResolvedPlaybackUrl` can now carry a `decodedFilePath` when local playback uses an external decoder.
- The HTML audio runtime now deletes the previous decoded file when switching sources, disposing the player, or discarding a stale async playback request.
- Settings now explains which external decoder path is currently usable: FFmpeg can transcode at runtime, while Foobar2000 is currently probe-only.
- Enabling external decoding now defaults an empty executable path to `ffmpeg`.
- The main-process probe accepts bare FFmpeg commands such as `ffmpeg` or `ffmpeg.exe` as PATH-resolved commands.
- The main-process runtime skips file-stat validation for PATH-resolved FFmpeg commands but still validates explicit executable paths.

## Verification

- `npm run typecheck:react`
- `npm run build:main`
- `npm run smoke:playback-capabilities`

## Next Plan

1. Step 143: improve player-visible error guidance for missing FFmpeg, unsupported output formats, and decoder failures.
2. Step 144: revisit UI/Electron click-through automation when the runtime environment is ready.
