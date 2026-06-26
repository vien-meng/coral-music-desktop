# Playback Capability Plan

Date: 2026-06-25

This plan extends the React/Electron migration with three new playback capability tracks:

1. local audio file playback and library import;
2. an external decoder adapter for formats that are not safe or practical to decode directly in Electron;
3. Coral Music User API source plugin configuration as the supported source-plugin path.

## Capability Requirements

### Local Audio Files

- Keep `local` music items as first-class music records with `meta.filePath`, `meta.ext`, duration, title, artist, album, and artwork when available.
- Play browser/Electron-native formats directly through the existing player runtime. The current native baseline is MP3, FLAC, WAV, M4A, AAC, OGG, and OPUS.
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

## Current Boundaries

- The project already has local URL resolution for `source === 'local'`; this only covers formats Electron can play directly.
- Foobar2000 integration is a future external adapter, not a direct in-process plugin loader.
- The migrated Coral Music User API flow already exists and should be extended, not replaced.
