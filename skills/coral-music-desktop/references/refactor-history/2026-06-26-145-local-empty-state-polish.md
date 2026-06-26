# Step 145: Local Empty State Polish

Date: 2026-06-26

## Summary

- Improved the empty and disabled states around local audio import.
- Kept the recovery path visible instead of silently disabling the user's entrypoint.

## Changes

- The local list empty state now exposes direct `导入本地音频` and `新建列表` actions.
- Added a dedicated `handleCreateLocalList` action that creates/selects `本地音乐`.
- Local audio import now checks `player.localAudio.enabled` before opening the file picker.
- When local audio import is disabled, the app shows a warning and jumps to the local decoder settings section.
- Playback capability smoke now guards the empty-state actions and disabled-import recovery path.

## Verification

- `npm run typecheck:react`
- `npm run smoke:playback-capabilities`

## Next Plan

1. Step 146: revisit UI/Electron click-through automation once the runtime environment is less noisy.
2. Step 147: run a focused visual pass on Settings/List/PlayBar when a stable app window is available.
