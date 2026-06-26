# Step 141: Playback Capability Smoke

Date: 2026-06-26

## Summary

- Expanded the focused playback capability smoke to match the current feature implementation.
- Guarded the local-file, external-decoder, User API, and top-level entrypoint paths without running the full release smoke loop.

## Changes

- Updated `smoke:playback-capabilities` to understand the new `ffmpeg` external decoder provider.
- Added smoke checks for `winMain_external_decoder_transcode` IPC contracts and the main-process external decoder runtime.
- Added checks that local playback separates native formats from external-decoder formats.
- Added checks that User API sources must declare a music `musicUrl` capability before they can be selected for playback.
- Added checks for the visible `本地文件` and `添加音源` quick-entry actions.

## Verification

- `npm run smoke:playback-capabilities`

## Next Plan

1. Step 142: tighten decoded-file cleanup and external decoder status hints.
2. Step 143: improve playback error guidance for missing FFmpeg and unsupported formats.
