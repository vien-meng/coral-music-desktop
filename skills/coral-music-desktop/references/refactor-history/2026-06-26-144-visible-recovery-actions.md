# Step 144: Visible Recovery Actions

Date: 2026-06-26

## Summary

- Added player-visible recovery actions for external decoder failures.
- Improved the local list empty state so users can start from the empty screen.

## Changes

- Added `configureExternalDecoder` as a UI quick action.
- Settings now consumes `configureExternalDecoder` and scrolls to the local decoder section.
- Player store now derives `needsExternalDecoder` from FFmpeg/external-decoder playback errors.
- PlayBar and Play Detail now show `配置解码器` for decoder-related failures.
- The local list empty state now exposes `导入本地音频` and `新建列表` actions.
- Playback capability smoke now guards these recovery actions.

## Verification

- `npm run typecheck:react`
- `npm run smoke:playback-capabilities`

## Next Plan

1. Step 145: polish Settings density and local playback empty/error states from screenshots or a running app pass.
2. Step 146: revisit UI/Electron click-through automation when the runtime environment is ready.
