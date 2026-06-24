# 2026-06-23 Step 58: Play Detail Window Chrome

## Context

Step 57 added visible queue status to the player bar and play-detail overlay. The next missing piece in the Step 8 player migration was fullscreen/window chrome parity for the React play-detail surface.

## Changes

- Updated the React IPC boundary for main-window fullscreen.
  - `ipcChannels.winMain.fullscreen` is now typed as a boolean request returning a boolean result.
  - `appService.setFullscreen()` and `appService.toggleFullscreen()` expose the typed React-facing service call.
- Cleaned `appService.ts` to match the current React/Vite lint style while adding the fullscreen API.
- Updated `PlayDetailOverlay`.
  - Added collapse, fullscreen/exit-fullscreen, minimize, and close-window controls in the detail header.
  - Hides minimize and close controls while fullscreen is active.
  - Tracks local fullscreen state and applies an `is-fullscreen` class to the overlay.
- Added a scoped CSS class for the play-detail window-control group.

## Validation

- `npx eslint src/renderer-react/services/appService.ts src/renderer-react/components/player/PlayDetailOverlay.tsx` passed.
- `npm run typecheck:react` passed.
- `npm run build:renderer` passed.
- `npm run build` passed.
- `npm run lint` still fails on historical issues, now at 753 errors after the `appService.ts` cleanup reduced the previous 806-error baseline.

## Boundaries

- This batch does not yet sync external fullscreen state changes such as F11 or OS-level toggles back into React state.
- This batch does not add fullscreen auto-hide pointer behavior.
- This batch keeps the existing main-process close/minimize behavior unchanged.
- Lyric menu/selection and comments remain pending.
- No visual browser smoke was run for this batch.

## Next Plan

1. Add play-detail keyboard handling for F11/Escape and keep it scoped to the open overlay.
2. Add fullscreen state sync from Electron if the main process already exposes a reliable event, or keep local state as the boundary until that event exists.
3. Port lyric menu/selection behavior.
4. Persist source-toggle fallback metadata after mutation boundaries are stable.
