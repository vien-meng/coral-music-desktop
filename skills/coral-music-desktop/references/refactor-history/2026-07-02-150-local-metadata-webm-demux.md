# Step 150: Local Metadata And WebM Demux Playback

Date: 2026-07-02

## Goal

Keep cover, sample-rate, and bitrate metadata across local formats, and make WebM audio playback reliable with the installed `web-demuxer` dependency.

## Implemented

- Local metadata enrichment keeps `music-metadata` as the primary parser for embedded cover art and format details.
- MP3/FLAC/WAV retain header-level fallback for sample-rate and bitrate when tags are incomplete.
- WebM metadata now uses `web-demuxer` media info as an additional fallback for audio-stream sample-rate and bitrate.
- WebM playback now first tries renderer-side `web-demuxer` demux plus WebCodecs `AudioDecoder`, then feeds decoded PCM into the existing AudioBuffer runtime.
- If WebCodecs or WebM demux/decode fails, playback falls back to the existing main-process `audio-decode` path.
- Playback-time local metadata enrichment now writes recovered metadata back to the selected list via typed `listMusicUpdate`, so recovered local cover/sample-rate/bitrate persists.

## Format Coverage Notes

- Embedded covers are only available when the file container/tag actually carries image metadata; unsupported or absent art still correctly falls back to the player/list placeholder.
- MP3, FLAC, WAV, and WebM have explicit non-tag fallback for bitrate/sample-rate.
- OGG/OGA, Opus, M4A/AAC/ALAC, QOA, AIFF, CAF, AMR, and WMA rely on `music-metadata` for bitrate/sample-rate/cover where the container supports it.

## Verification

- `tsc --noemit`
- `smoke:playback-capabilities`
- focused `eslint`
- renderer Vite build confirmed `web-demuxer-mini.wasm` is emitted under `dist/assets`.
