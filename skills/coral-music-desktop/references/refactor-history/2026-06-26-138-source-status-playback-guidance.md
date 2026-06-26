# Step 138: Source Status And Playback Guidance

Date: 2026-06-26

## Summary

- Made playback failures visible and actionable instead of leaving the player in a silent error state.
- Added current User API source status to Settings.
- Kept validation scoped to typecheck and static patch checks.

## Changes

- Extended `PlayerRuntimeStatus` with `errorText`.
- `HtmlAudioPlayerRuntimeBackend` now publishes URL-resolution and audio-play errors.
- `PlayerStore` exposes `errorText` and `needsSourcePlugin`.
- `PlayBar` shows error text in the subtitle and adds an `添加音源` action for missing-source failures.
- `PlayDetailOverlay` shows an error alert with an add-source action.
- Settings User API section now displays the current source, readiness state, and supported music platforms.

## Verification

- `git diff --check`
- `npm run typecheck:react`

## Next Plan

1. Step 139: implement the external decoder runtime/transcode adapter.
2. Step 140: add stricter User API validation after import before marking a source as ready.
