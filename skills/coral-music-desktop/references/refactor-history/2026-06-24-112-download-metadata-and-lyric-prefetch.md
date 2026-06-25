# Step 112: Download Metadata And Lyric Prefetch

## Summary

- Continued after Step 111 queue scheduling.
- Completed the next download runtime side-effect layer: lyric prefetch, sidecar export, embedded metadata, and completed-file verification.
- Kept the renderer/main split: renderer fetches lyrics through the migrated music SDK, main process writes files and metadata.

## Changes

- Added typed `saveLyricRaw` IPC contract and exposed `lyricService.saveLyricRaw`.
- Added `downloadService.ensureDownloadLyricCached`:
  - checks existing raw lyric cache,
  - fetches lyrics through the migrated `musicSdk` when needed,
  - saves fetched lyrics into the main-process raw lyric DB.
- Updated `DownloadStore`:
  - prefetches lyrics before starting a queued task when sidecar or embedded lyric settings are enabled.
- Updated `downloadRuntime`:
  - verifies completed files exist and are non-empty before marking tasks completed,
  - writes cached lyric sidecars according to `download.isDownloadLrc`, `download.isDownloadLxLrc`, `download.isDownloadTLrc`, `download.isDownloadRLrc`, and `download.lrcFormat`,
  - writes MP3/FLAC metadata through `@common/utils/musicMeta`,
  - embeds title, artist, album, cover, and configured lyric text where supported,
  - isolates side-effect failures so a valid audio download is not marked failed only because metadata/lyric writing failed.

## Verification

- `npm run typecheck:react`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `rg "download runtime is not migrated|window\\.lx\\.worker|@renderer/|../../renderer|../../../renderer" src/renderer-react src/main src/shared`: no matches.
- `find src -name "*.vue"`: no output.
- `npm run dev`: not rerun in this step because the required escalation was rejected by the usage limit. Step 109 and Step 110 had already validated the dev startup path.

## Next Step

- Step 113: run a real download smoke pass when dev startup can be launched again, clean renderer bundle warnings caused by node-only imports, and start removing obsolete Vue/Webpack dependencies from package metadata.
