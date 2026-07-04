# Playback Capability Plan

Date: 2026-06-25

This plan extends the React/Electron migration with three new playback capability tracks:

1. local audio file playback and library import;
2. an external decoder adapter for formats that are not safe or practical to decode directly in Electron;
3. Coral Music User API source plugin configuration as the supported source-plugin path.

## Capability Requirements

### Local Audio Files

- Keep `local` music items as first-class music records with `meta.filePath`, `meta.ext`, duration, title, artist, album, and artwork when available.
- Play browser/Electron-native formats directly through the existing player runtime. When Electron cannot play a supported local format, fall back to the bundled `audio-decode` path and hand a WAV Blob URL to the existing runtime. The internal decode baseline is MP3, WAV, OGG/OGA Vorbis, FLAC, Opus, M4A/AAC/ALAC, QOA, AIFF, CAF, WebM, AMR, and WMA.
- Add folder/file import and rescan workflows before building a large local-library manager.
- Keep path access in the main process or existing Node bridge boundary; the React UI should not assume direct filesystem access.

### Foobar2000 / External Decoder Adapter

- Foobar2000 components must not be loaded as native DLLs inside Electron renderer or main process.
- Treat Foobar2000 as an explicitly configured external decoder adapter process.
- Configuration should include the Foobar2000 executable path, plugin/component directories, supported extension list, preferred output mode, and timeout.
- Target formats include FLAC fallback, DSD files (`.dsf`, `.dff`), SACD images/aliases (`.iso`, `.sacd`; accept the common typo `sadc` as a normalized alias only).
- Output should be normalized to WAV or PCM and then passed back to the existing player runtime as a playable local URL/stream.
- On non-Windows platforms, Foobar2000 adapter support is optional and should be disabled or replaced by a platform-appropriate decoder adapter.
- Security boundary: never auto-load arbitrary native components; only execute a user-selected decoder path with validated arguments and temporary output directories.

### Coral Music User API Source Plugins

- Keep the existing Coral Music User API runtime as the source-plugin compatibility path.
- Continue to store and select the active source plugin through `common.apiSource`.
- The Settings User API surface remains the primary configuration entry for import file, online import, enable/update-alert, remove, and set-current actions.
- Future source-plugin work should improve validation, status display, and smoke coverage before introducing any new plugin registry.

## Step Plan

### Step 131: Capability Contract And Guardrails

Status: in progress on 2026-06-25.

- Add shared playback capability constants.
- Add AppSetting keys and conservative defaults for local audio, external decoder, and source-plugin preference.
- Add smoke coverage that keeps the plan, defaults, local playback boundary, and User API source-plugin boundary visible.

### Step 132: Local File Import And Library UI

- Add file/folder picker IPC for local audio import.
- Scan metadata into `MusicInfoLocal` records.
- Add React list/library actions for local files and folder rescan.
- Keep direct playback for native formats through `resolveLocalMusicUrl`.

### Step 133: External Decoder Probe

- Add main-process IPC to validate the configured Foobar2000 executable and plugin/component directories.
- Detect supported adapter formats without playing user files.
- Surface adapter readiness and platform limitations in Settings.

### Step 134: Decoder Runtime Adapter

- Add a controlled external process runner for Foobar2000 decode/transcode.
- Decode unsupported local formats to WAV or PCM in a temp/cache directory.
- Feed the decoded output into the existing player runtime and clean temporary outputs safely.

### Step 135: Source Plugin Management Polish

- Improve Coral Music User API status display and validation.
- Add current source plugin health checks for search/detail/play URL resolution.
- Keep `common.apiSource` as the selected source-plugin key.

### Step 136: Playback Capability Smoke

- Add local fixture playback/import smoke where possible.
- Add decoder adapter probe smoke using a fake adapter executable in test mode.
- Add User API source-plugin smoke around import, selection, and rollback.

### Step 147: audio-decode Internal Decoder Expansion

Status: implemented on 2026-07-01.

- Replace the dedicated FLAC-only WASM dependency with `audio-decode` as the single in-app local decoder path.
- Extend import/playback candidates to the `audio-decode` supported package set: MP3, WAV, OGG/OGA Vorbis, FLAC, Opus, M4A/AAC/ALAC, QOA, AIFF, CAF, WebM, AMR, and WMA.
- Route all imported/downloaded local-file playback through `audio-decode` before playback so local format behavior is centralized and no longer depends on Electron `Audio.canPlayType()`.

### Step 148: JustDSD DSD/DFF Adapter

Status: implemented on 2026-07-01.

- JustDSD is usable for Coral as a Java helper because it supports `.dsf`, `.dff`, SACD containers, PCM encoding, and DST decompression.
- Do not bundle JustDSD into the renderer. It runs behind the existing external decoder boundary as a `justdsd` provider.
- JustDSD is the default external decoder provider. Java and `jdsd-nodep.jar` paths are optional overrides; when left empty, Coral resolves bundled assets from `resources/justdsd`.
- Coral ships a small Java source-file helper that uses JustDSD classes to export `.dsf`/`.dff`/`.iso`/`.sacd` to temporary WAV.
- After JustDSD/FFmpeg produces a WAV, Coral still decodes that WAV through `audio-decode`, so the runtime path remains unified.

### Step 149: Local Import And Zero-Config Decoder UX

Status: implemented on 2026-07-02.

- Windows local-audio import no longer relies on a strict extension picker filter; the dialog shows files and folders, and `localAudioService` remains the single source of truth for supported-format filtering.
- App-shell drag/drop now accepts local files, folders, and mixed selections, then imports them into the fixed `本地音乐` list through the existing recursive scan, metadata read, de-duplication, and import result prompts.
- The ordinary Settings page no longer exposes external-decoder enable/output/timeout/extension/probe controls. Bundled FFmpeg transcode remains an internal always-on playback capability for DSF/DFF/AC3/ALAC-style formats.
- Legacy external-decoder setting keys stay in the schema/defaults for data compatibility and smoke coverage, but playback/import no longer lets stale user settings disable DSF/DFF discovery or playback.
- Missing bundled FFmpeg is treated as an application installation-integrity issue and should tell the user to reinstall instead of asking them to enable a setting.

### Step 150: Low-Latency External Streams, WebM Demux, And APE Album Mode

Status: implemented on 2026-07-03.

- DFF/DSF/APE and WebM fallback playback use a one-time localhost FFmpeg stream URL instead of waiting for a complete temporary WAV file. Closing or switching the track closes the HTTP connection and terminates FFmpeg.
- DFF streams explicitly force FFmpeg's IFF demuxer (`-f iff`) before input, because the bundled FFmpeg exposes DSF as a named demuxer but DFF/DSDIFF through its IFF container path.
- WebM audio first tries `web-demuxer` plus WebCodecs, with the WASM asset served locally in dev and emitted into renderer assets during build.
- CUE files are parsed as album sidecars during local import. A referenced long APE file becomes per-track virtual local music items with stable IDs, track number, start/end timestamps, inherited metadata, and normal queue behavior.
- SFV entries attach their expected CRC32 values to matching virtual tracks and unmatched tracks are marked `missing`. Full-file CRC calculation stays out of the ordinary import path so large APE album images are not reread before playback.
- APE native decoder adoption remains gated behind a zero-config packaging check: only a cross-platform, stream/seek-capable Monkey's Audio SDK or equivalent adapter can replace FFmpeg streaming.

### Step 151: Native APE Decoder Adapter Evaluation

Status: native helper source/build path implemented on 2026-07-03; Windows packaging verification still pending.

- Add the native APE path as an internal provider behind the existing external-stream contract, not as a user-visible setting.
- `externalDecoderProviders` now models `native-ape` ahead of FFmpeg and enables it when the packaged helper is available for the current platform. Runtime stream creation selects through this provider boundary, so APE playback uses the native helper first and falls back invisibly to FFmpeg before any user-visible stream error.
- Native APE helper integration is now implemented as an out-of-process `coral-ape-helper` protocol under packaged `resources/bin`. The helper outputs WAV bytes on stdout and accepts `--input`, `--format wav`, plus optional `--start-ms`/`--end-ms` arguments so CUE tracks can stream only their requested range. If the helper is absent or fails before emitting audio, playback falls back to FFmpeg without user-visible configuration.
- `build:native-ape-helper` builds the helper from the official Monkey's Audio SDK source using `MAC_SDK_DIR` or the official SDK zip, and `smoke:native-ape-helper` generates a WAV, smoke-encodes it to APE through the helper, then verifies ranged APE-to-WAV decoding.
- Monkey's Audio SDK is the native APE adapter path. The official developer page says the SDK includes full source code, supports compress/decompress/verify/convert, can perform on-the-fly decompression, and ships Windows Visual Studio plus macOS Xcode projects. Current local evidence proves the Darwin arm64 helper build and generated APE roundtrip; Windows helper build, signing, and real APE album samples still need verification.
- The adapter must stream PCM/WAV chunks and seek by sample/time range so CUE virtual tracks can start instantly without decoding the whole album image.
- CUE/SFV support stays in Coral's TypeScript album layer. The native adapter only decodes the referenced APE media path and requested time range; it must not own playlist/list metadata behavior.
- SFV should remain album-side diagnostic metadata: parse and attach CRC expectations during import, then add optional verification later without blocking playback.
- If the native adapter is missing, unsupported on the current platform, or slower than FFmpeg for a file, playback falls back to the existing one-time FFmpeg stream URL without showing configuration to ordinary users.
- Success criteria: APE+CUE imports as per-track album rows, first audible PCM arrives quickly after play/seek, memory stays bounded by stream buffers, packaged app remains one-click usable, and smoke/build gates cover parser fixtures plus native/FFmpeg fallback selection. Current local evidence proves the Darwin arm64 helper build plus generated APE roundtrip; Windows helper build, signing, and real APE album samples still need verification.

## Current Boundaries

- Local file playback now resolves through `audio-decode`; direct Electron local file playback is intentionally disabled for maintainability.
- DSF/DFF and other bundled-transcode formats are zero-config for ordinary users; decoder toggles and format details must not reappear in the standard Settings UI.
- APE album images with `.cue` import as virtual tracks by default; only standalone APE files without CUE remain single long tracks.
- APE native decoding is now available when `coral-ape-helper` is packaged for the current platform; FFmpeg streaming remains the invisible fallback.
- DSF/DFF/APE+CUE should not be marked end-to-end complete until `CORAL_REQUIRE_EXTERNAL_AUDIO_SAMPLES=true node build-config/smoke-external-audio-samples.js` passes against real sample files.
- Foobar2000 integration is a future external adapter, not a direct in-process plugin loader.
- The migrated Coral Music User API flow already exists and should be extended, not replaced.
