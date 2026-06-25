# Step 111: Download Queue And Lyric Sidecars

## Summary

- Continued after Step 110 download runtime bridge.
- Added React-side queue scheduling for download tasks, driven by `download.maxDownloadNum`.
- Added cached lyric sidecar export after a download completes.
- Kept the architecture boundary from Step 110: renderer resolves URLs and owns queue decisions; main process executes filesystem downloads.

## Changes

- `DownloadStore` now:
  - receives `SettingsStore`,
  - exposes current concurrent/running/queued task counts,
  - queues selected runnable tasks,
  - starts only as many tasks as allowed by `download.maxDownloadNum`,
  - automatically starts the next queued task after complete/error/pause slot release,
  - bounds automatic URL refresh retry to two attempts per task,
  - persists queued/failed status changes through typed download list update IPC.
- `DownloadRoutePanel` now shows:
  - active downloads against max concurrency,
  - queued task count.
- `downloadRuntime` now:
  - writes cached lyric sidecar files on completed downloads when `download.isDownloadLrc` is enabled,
  - supports `.lrc`, `.lx.lrc`, `.tlrc`, `.rlrc` according to existing settings,
  - respects `download.lrcFormat` with UTF-8 or GB18030 encoding,
  - treats common transient/network URL failures as `refreshUrl` requests.

## Verification

- `npm run typecheck:react`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- Targeted eslint for changed React files: passed.
- `rg "download runtime is not migrated|window\\.lx\\.worker|@renderer/|../../renderer|../../../renderer" src/renderer-react src/main src/shared`: no matches.
- `find src -name "*.vue"`: no output.

## Known Follow-Up

- Step 112 should implement embedded metadata writing for MP3/FLAC, online lyric fetch fallback when the cache is empty, post-complete file integrity checks, and a manual smoke pass with real download tasks.
