# Step 135: Settings External Decoder Configuration

Date: 2026-06-25

## Summary

- Exposed the local playback decoder configuration in the React Settings route.
- Settings can now persist Foobar2000 provider/output/timeout values, executable path, component directories, and external decoder extensions.
- The UI can run the Step 134 non-executing probe and display readiness, errors, warnings, platform, extension coverage, and component directory status.

## Changes

- Added a `本地解码` Settings section to `src/renderer-react/features/settings/SettingsRoutePanel.tsx`.
- Added executable and component-directory selection through the existing Electron open-dialog service.
- Normalized extension input with the shared playback capability helper.
- Added compact Settings styles for decoder path inputs and probe results.
- Updated `component-migration-plan.md` so the next implementation task is the runtime/transcode adapter.

## Verification

- Manual code-path review only. Per current task direction, this step avoided the full lint/typecheck/build/smoke loop and focused on making the Settings feature path usable.

## Next Plan

1. Step 136: implement the external decoder runtime/transcode adapter for unsupported local formats.
2. Step 137: polish LX Music User API source-plugin management with validation/status display.
3. Step 138: add focused playback capability smoke around local import/playback, fake decoder probing, and User API rollback.
