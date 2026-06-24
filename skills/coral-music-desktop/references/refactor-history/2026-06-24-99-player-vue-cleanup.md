# Step 99: Player Vue Cleanup

## Summary
- Confirmed the React runtime already uses `src/renderer-react/components/player/PlayBar.tsx` through `AppShell.tsx`.
- Confirmed React replacements exist for:
  - `PlayBar`
  - `PlayDetailOverlay`
  - `ProgressBar`
  - `VolumeBtn`
  - `PlaybackRateBtn`
  - `TogglePlayModeBtn`
  - `LyricMenu`
  - `MusicCommentPanel`
  - `LyricSelectionPanel`
- Deleted migrated Vue player/playback files:
  - `src/renderer/components/layout/PlayBar/`
  - `src/renderer/components/layout/PlayDetail/`
  - `src/renderer/components/common/PlaybackRateBtn.vue`
  - `src/renderer/components/common/ProgressBar.vue`
  - `src/renderer/components/common/TogglePlayModeBtn.vue`
  - `src/renderer/components/common/VolumeBtn.vue`

## Verification
- `npm run lint` passed.
- `npm run typecheck:react` passed.
- `npm run build` passed.

## Current Vue Inventory
- Remaining `.vue` files under `src/renderer`: **26**
- Remaining areas:
  - `components/common`: audio visualizer, download/list modals, sound effect suite
  - `components/layout`: update/sync/pact/changelog/icons modals
  - `components/material`: legacy material list/modal/search primitives
  - `App.vue`: old Vue app root

## Next Step
- Step 100: clean up common/material Vue components that already have React replacements or are no longer reachable from the Vite React renderer.
