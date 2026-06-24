# 2026-06-23 Step 59: Play Detail Keyboard Fullscreen

## Context

Step 58 added React-owned play-detail window chrome controls and the typed fullscreen IPC service boundary. The overlay still needed scoped keyboard behavior so fullscreen state could be exercised without relying on the old Vue `window.key_event` path.

## Changes

- Updated `PlayDetailOverlay`.
  - Added a shared `applyFullscreen()` helper around `appService.setFullscreen()`.
  - Added a scoped `keydown` listener only while the play-detail overlay is open.
  - `F11` toggles fullscreen through the React IPC boundary.
  - `Escape` exits fullscreen when fullscreen is active.
  - `Escape` closes the play-detail overlay when it is not fullscreen.
- Kept the keyboard behavior local to Play Detail instead of taking over the global legacy hotkey layer.

## Validation

- `npx eslint src/renderer-react/components/player/PlayDetailOverlay.tsx` passed.
- `npm run typecheck:react` passed.
- `npm run build:renderer` passed.
- `npm run build` passed.
- `npm run lint` still fails on the known 753 historical errors outside this batch; this batch did not increase the current baseline.

## Boundaries

- This batch does not add an Electron fullscreen-change event from main process to renderer.
- This batch does not implement fullscreen auto-hide pointer behavior.
- The fullscreen state is still React-local for Play Detail and changes only through the overlay controls or scoped keyboard handler.
- Lyric menu/selection and comments remain pending.

## Next Plan

1. Port the Play Detail lyric menu/selection surface.
2. Add fullscreen-change event sync only if a reliable main-process event is introduced.
3. Persist source-toggle fallback metadata after mutation boundaries are stable.
4. Defer comments until lyric controls and overlay state ownership are stable.
