# Step 149: Local Import, Drag/Drop, And Zero-Config Decoder UX

Date: 2026-07-02

## Goal

Make local music import and DSF/DFF playback behave like an installed-app feature instead of an expert configuration task.

## Implemented

- Windows local-audio picker now uses an `All Files` dialog with file, folder, and multi-selection enabled. Import filtering stays inside `localAudioService`, so unsupported files are still skipped during scan.
- `listStore` now owns `ensureLocalAudioList()` and `importLocalAudioPathsToLocalList()`, so every local import path can consistently create/select the fixed `本地音乐` list before adding tracks.
- App shell now prevents the browser default file-open behavior for drag/drop and imports dropped files/folders/mixed selections into `本地音乐`.
- Drag/drop uses the same recursive scan, metadata extraction, duplicate detection, and success/duplicate/empty-result messages as the existing local import flow.
- Ordinary Settings no longer exposes the external-decoder switch, output format, timeout, supported-extension editor, or manual probe result.
- Bundled FFmpeg transcode is treated as an internal always-on capability for DSF/DFF/AC3/ALAC-style local files. Legacy setting keys remain for compatibility, but stale values no longer disable import or playback.
- Player error actions no longer show `配置解码器`; missing or broken bundled FFmpeg should read as an installation-integrity problem, not a user setting problem.

## Guardrails

- `smoke:playback-capabilities` now checks:
  - local picker uses `All Files`;
  - local imports route through `importLocalAudioPathsToLocalList`;
  - AppShell has global drag/drop handlers and a drop overlay;
  - Settings does not reintroduce external-decoder controls;
  - playback no longer gates bundled-transcode formats behind user-visible external-decoder enable/extension settings.

## Notes

- The visible `本地音频导入` switch remains a broad local-import capability switch.
- The `configureExternalDecoder` quick-action name remains internally for backwards-compatible routing to the local decode section; it should not be used as user-facing copy.
