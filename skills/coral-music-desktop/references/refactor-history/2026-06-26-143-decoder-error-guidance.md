# Step 143: Decoder Error Guidance

Date: 2026-06-26

## Summary

- Improved player-visible decoder failure messages.
- Prevented users from selecting an external decoder output mode that the current runtime cannot play.

## Changes

- Missing FFmpeg now reports an actionable Chinese error instead of raw `spawn ENOENT`.
- FFmpeg permission failures now explain that the executable path lacks execution permission.
- Enabling or switching to FFmpeg forces `player.externalDecoder.preferredOutput` back to `wav`.
- Settings disables the PCM output option until the player runtime supports raw PCM handoff.
- Playback capability smoke now guards the missing-FFmpeg message, permission message, WAV forcing, and disabled PCM option.

## Verification

- `npm run typecheck:react`
- `npm run build:main`
- `npm run smoke:playback-capabilities`

## Next Plan

1. Step 144: revisit UI/Electron click-through automation once the runtime environment is less noisy.
2. Step 145: polish Settings density and local playback empty/error states from screenshots or a running app pass.
