# Step 150: Streaming External Playback, WebM Demux, and APE Album Mode

## Goal

Make large local formats feel playable immediately while preserving zero configuration: DFF/DSF/APE avoid full temporary-WAV preparation, WebM has a demux-first path, and APE album images can import as real per-track CUE albums.

## Changes

- Added one-time localhost FFmpeg stream URLs for external decoder playback. The renderer receives a playable `audio/wav` stream, a token is consumed on first valid request, the startup timeout only covers "FFmpeg produced no audio yet", and the main process kills FFmpeg when the response connection closes.
- Moved FFmpeg stream argument construction into a shared pure helper so CUE `startMs`/`endMs` ranges are smoke-tested as concrete `-ss`/`-t` arguments before the main process spawns FFmpeg.
- Added an explicit DFF stream input-format hook: DFF passes `-f iff` before `-i` because the bundled FFmpeg exposes DSF directly and DFF through the IFF-family demuxer path.
- Made FFmpeg stream startup timeouts fail explicitly instead of silently closing the stream, so broken installs or corrupt large-format files surface as actionable playback errors.
- Added CUE/SFV sidecar parsing for local imports. CUE tracks become virtual `MusicInfoLocal` rows with `trackStartMs`, `trackEndMs`, `trackNo`, `cuePath`, and inherited cover/bitrate/sample-rate metadata.
- SFV sidecars now attach expected CRC32 values to matching virtual tracks and mark tracks as `missing` when a sidecar exists but has no matching entry. Full CRC calculation remains a pure helper/diagnostic path instead of running during normal import, so large APE album files are not reread just to verify integrity before playback.
- Kept the CUE/SFV grammar in a shared pure parser so fixture smoke can validate Windows-style paths, INDEX frame timing, album metadata propagation, and SFV CRC normalization without booting Electron.
- Kept CUE import to a single sidecar read/parse per file: after referenced album image durations are probed, Coral completes final-track `endMs` in memory instead of rereading the CUE.
- Added WebM demux decode support through `web-demuxer` and WebCodecs, with the WASM asset served in dev and emitted during renderer builds.
- Added fallback from WebM demux failure to FFmpeg streaming, so unsupported WebCodecs codecs still play without user configuration. Large local WebM files now skip the in-renderer demux path after a bounded file-size check and go straight to the FFmpeg stream adapter, avoiding a full WebM read/decode allocation for long recordings.
- Extracted external-stream snapshot/seek time calculation so CUE track seek behavior is tested directly: seek targets clamp to the virtual track duration before recreating the FFmpeg stream, progress includes the recreated-stream offset, and ended state jumps to track duration.
- Tightened local metadata enrichment so sample rate gaps are refreshed even when cover and bitrate already exist.
- Added a generated local-audio fixture smoke that synthesizes short WAV/FLAC/OGG/Opus/M4A/AIFF/CAF/WebM files with bundled FFmpeg, decodes them through `audio-decode`, and verifies embedded FLAC cover art plus sample-rate/bitrate metadata through `music-metadata`.
- The same generated fixture smoke now creates temporary CUE/SFV album directories and executes `scanLocalMusicInfosFromPaths`, proving that virtual tracks carry `cuePath`, shared album image paths, track start/end times, SFV expected CRC32 values, and `unchecked`/`missing` SFV statuses.
- Added an optional external-sample smoke for real `.ape`, `.dsf`, `.dff`, and `.cue` files. It scans `test-fixtures/local-audio` or `CORAL_AUDIO_SAMPLE_DIR`, uses the same FFmpeg stream-argument helper as playback, verifies WAV headers from decoded samples, and can be made mandatory with `CORAL_REQUIRE_EXTERNAL_AUDIO_SAMPLES=true`.
- The external-sample smoke also synthesizes a tiny valid DSF container and decodes it through the same stream args, so DSF has a real container-level zero-config FFmpeg playback check even before external sample files are provided.
- The external-sample smoke also synthesizes a tiny DFF/DSDIFF container and decodes it through the forced `-f iff` stream path, so DFF has the same container-level zero-config FFmpeg playback check.
- Added an internal external-stream provider selector. `native-ape` is the first-choice provider when the packaged helper exists, and FFmpeg remains the invisible fallback when the helper is missing or fails before emitting audio.
- The FFmpeg stream provider now explicitly covers WebM in addition to DSF/DFF/ALAC/AC3/APE, which makes the WebM demux fallback path real instead of only documented.
- Reserved the native APE helper contract and package location: `resources/bin/coral-ape-helper` or `.exe` can be discovered through `process.resourcesPath` or `CORAL_NATIVE_APE_HELPER_PATH`, receives `--input --format wav --start-ms --end-ms`, and must stream WAV to stdout. The HTTP stream runtime delays response headers until first audio bytes, so a missing/failing helper can fall back to FFmpeg before the player sees an error.
- Implemented the helper source and build script. `build:native-ape-helper` compiles Monkey's Audio SDK source with `clang++`, either from `MAC_SDK_DIR` or the official SDK zip, and writes the helper to `resources/bin`. `smoke:native-ape-helper` now proves the built helper can generate a short APE fixture and decode a requested time range back to a WAV stream.
- Hardened the native helper build for release machines. The builder now accepts `CORAL_NATIVE_APE_CXX`, auto-selects `cl.exe` on Windows when available, otherwise uses `clang++`, emits `coral-ape-helper.exe` on Windows, and keeps platform defines explicit for Windows, macOS, and Linux.
- `build-pack.js` now checks the current-platform native APE helper before packaging and runs `build-native-ape-helper.js` automatically when the helper is missing, so release packaging does not silently ship without the zero-config APE fast path.
- Cross-platform packaging is guarded: Windows targets require `resources/bin/coral-ape-helper.exe`, macOS/Linux targets require `resources/bin/coral-ape-helper`, and only same-platform packaging auto-builds a missing helper. A cross-target package without the correct prebuilt helper now fails loudly instead of shipping a broken zero-config APE path.
- Cross-platform packaging now refuses host helper reuse by default even when the helper filename matches, which prevents macOS `coral-ape-helper` from being silently copied into a Linux package. The only bypass is an explicit `CORAL_ALLOW_CROSS_PLATFORM_NATIVE_APE_HELPER=true` release override with a prebuilt helper in place.
- `build-pack.js` now exports its helper guard functions and `smoke:build-pack-helper` behavior-tests target platform normalization, helper path selection, CLI param parsing, current-platform helper presence, and the cross-platform Windows `.exe` missing-helper failure path.
- `smoke:build-pack-helper` also covers the cross-platform Linux helper case so same-name host binaries cannot pass package checks accidentally.
- Added `smoke:windows-package` for Windows release machines. It verifies `build/win-unpacked/resources/bin/coral-ape-helper.exe` when a Windows unpacked package exists, requires a local `.exe` on Windows build hosts, and can be forced in CI with `CORAL_REQUIRE_WINDOWS_PACKAGE_SMOKE=true`.
- Added `smoke:windows-acceptance` as the one-command Windows release gate. On Windows, or with `CORAL_RUN_WINDOWS_ACCEPTANCE=true`, it runs the build-pack helper guard, requires the Windows packaged helper, requires the native APE helper roundtrip, and reruns playback/import capability smoke.
- Kept the local-audio picker on an `All Files` filter so Windows does not hide files and CUE/SFV sidecars remain selectable; supported-format filtering stays in `localAudioService`.
- Added a separate local-folder import dialog and button. On Windows, the file picker stays `openFile`-only so files remain visible, while folder import uses a directory-only picker instead of relying solely on drag/drop.
- Replaced local-import-disabled routing with `configureLocalAudioImport`. The old `configureExternalDecoder` quick action remains only as a backward-compatible Settings scroll target; current local import and drag/drop flows no longer request an external-decoder configuration action.
- Updated the Settings local decode status copy to describe zero-config built-in decoding, native APE preference, and streaming decode fallback. It no longer tells users that DSF/DFF/APE playback works by pre-transcoding to temporary WAV.
- Updated local playback resolver comments and fallback errors from old "FFmpeg transcode" language to built-in decode wording. If the WAV fallback output cannot be read, the user-facing error now points to application integrity/reinstall instead of a decoder configuration problem.
- Removed the unused `needsExternalDecoder` recovery flag from the player store and locked it out in smoke so future UI cannot accidentally reintroduce a "configure decoder" recovery action.
- Hardened drag/drop path extraction by reading both `dataTransfer.files` and file-kind `dataTransfer.items`, trimming paths, using Electron `webUtils.getPathForFile` as a fallback, and de-duplicating mixed file/folder drops before import.
- The drag/drop smoke now covers empty paths, duplicate file/item entries, and Electron `webUtils.getPathForFile` fallback, which is the critical path for Explorer-style drops on Windows.
- Split local import scanning from list insertion so import results carry scanned candidate count and skipped invalid/unavailable entries. Drag/drop and dialog imports now include skipped entries in user feedback instead of always reporting `skippedCount: 0`.
- Local header probing now reads only the first 64 KB through `readFileSlice` instead of reading the whole audio file and slicing in memory, so importing long APE/DSF/DFF album images does not allocate the entire file just to refresh sample rate/bitrate fallback metadata.
- Extended packaging/dist smoke coverage for zero-config playback resources: `ffmpeg-static` must stay external in main Vite, be included in electron-builder files with `asar: false`, have an installed binary, execute successfully, expose APE/DSD/DST/ALAC/AC3/Opus/Vorbis decoders plus APE/DSF/IFF/WebM/M4A/OGG/WAV demuxers, and renderer builds must emit `dist/assets/web-demuxer.wasm`.

## Verification

- `node ./node_modules/typescript/bin/tsc --noemit` passed with the bundled Codex Node runtime because `npm` was not available in the shell PATH.
- `node build-config/smoke-playback-capabilities.js` covers WebM demux wiring, one-time stream token consumption, stream IPC/runtime cleanup, FFmpeg stream range arguments, CUE seek/progress math, APE CUE/SFV import wiring, local import candidate/skipped statistics, mixed file/folder drag/drop path extraction, and a real CUE/SFV parser fixture.
- `node build-config/smoke-playback-capabilities.js` now also verifies WebM selects the FFmpeg stream provider as fallback and that the local resolver keeps a `WEBM_DEMUX_MAX_BYTES` threshold before attempting in-renderer WebM demux.
- Focused ESLint passed for the touched playback/import/runtime files.
- `node ./node_modules/vite/bin/vite.js build` passed and emitted `dist/assets/web-demuxer.wasm`.
- `node build-config/smoke-package-audit.js` passed with zero-config decoder resource and FFmpeg decoder/demuxer capability checks.
- `node build-config/smoke-package-audit.js` also verifies the native APE helper builder keeps the SDK download, `CORAL_NATIVE_APE_CXX`, `cl.exe`, `clang++`, Windows `.exe`, and platform defines wired for release builds.
- The package audit also verifies `build-pack.js` keeps the pre-package native APE helper guard and still copies `resources/bin` into app resources.
- The package audit now also verifies the target-platform helper guard, including the Windows `.exe` requirement and the loud missing-helper error.
- `smoke:release` now includes `smoke:build-pack-helper`, so release checks exercise the package-helper guard instead of relying only on source-string audit.
- `node build-config/smoke-windows-package.js` skips on this macOS workspace without `build/win-unpacked`, but is now registered as the Windows package acceptance gate.
- `node build-config/smoke-windows-acceptance.js` skips on non-Windows hosts by default and should be run on the Windows build machine after producing `build/win-unpacked`.
- `node build-config/smoke-local-audio-fixtures.js` passed with generated audio fixtures and a covered FLAC metadata fixture.
- `node build-config/smoke-local-audio-fixtures.js` now blocks full `readFile` on a large generated local audio file while running `scanLocalMusicInfosFromPaths`, proving local header probing stays on the bounded `readFileSlice` path.
- `node build-config/smoke-local-audio-fixtures.js` now also writes a GB18030-encoded Chinese CUE and imports it through `scanLocalMusicInfosFromPaths`, proving album, performer, and track title text survive the real renderer import path.
- `node build-config/smoke-external-audio-samples.js` is available for real DSF/DFF/APE/CUE samples; it skips cleanly when no sample directory is present unless `CORAL_REQUIRE_EXTERNAL_AUDIO_SAMPLES=true` is set.
- `MAC_SDK_DIR=/private/tmp/MAC_1317_SDK node build-config/build-native-ape-helper.js` built `resources/bin/coral-ape-helper` on Darwin arm64.
- `node build-config/smoke-native-ape-helper.js` passed, including generated WAV to APE to ranged WAV roundtrip through the native helper.
- `node build-config/smoke-native-ape-helper.js` now also compares full APE WAV output with `--start-ms/--end-ms` range output and requires the range data chunk to be substantially smaller, proving CUE album playback can decode only the requested track segment instead of preparing the whole album image first.
- `node build-config/smoke-dist-output.js` passed with `web-demuxer.wasm` asset checks.
- `node build-config/build-pack.js target=dir` passed on Darwin arm64 after adding a temporary npm shim for this Codex runtime, which does not provide npm. The generated app contains `Coral Music.app/Contents/Resources/bin/coral-ape-helper`.
- After the cross-platform builder update, `MAC_SDK_DIR=/private/tmp/MAC_1317_SDK node build-config/build-native-ape-helper.js`, `node build-config/smoke-native-ape-helper.js`, `node build-config/smoke-playback-capabilities.js`, `node ./node_modules/typescript/bin/tsc --noemit`, and focused ESLint passed again.

## Follow-ups

- Add Windows CI/build-machine verification for `coral-ape-helper.exe`, Windows picker visibility, and real drag/drop from Explorer. The code paths are covered by smoke, but the final UX still needs a real Windows desktop pass.
- Official SDK review: Monkey's Audio 13.17 SDK is the native APE adapter because the developer page states it includes source code and supports on-the-fly decompression, analyzing APE files, and whole-file verify/convert workflows. Coral now packages it as an out-of-process helper behind the existing external-stream contract, with FFmpeg streaming kept as the invisible fallback.
- Add real-world sample coverage for multi-disc CUE files exported by common Windows rippers once representative user files are available; current smoke covers relative paths, Windows backslashes, absolute paths, file URI paths, SFV entries, and GB18030 CUE text.
