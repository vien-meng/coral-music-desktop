# Step 100: Common And Material Vue Cleanup

## Summary
- Deleted common Vue modules that are covered by React implementations:
  - `src/renderer/components/common/DownloadModal.vue`
  - `src/renderer/components/common/DownloadMultipleModal.vue`
  - `src/renderer/components/common/ListAddModal.vue`
  - `src/renderer/components/common/ListAddMultipleModal.vue`
- Deleted the legacy Vue material component directory:
  - `src/renderer/components/material/`
  - This included `OnlineList/index.vue` plus its old JS/TS helper hooks, `Pagination.vue`, `PopupBtn.vue`, `SearchInput.vue`, `SongList.vue`, `ListButtons.vue`, and `Modal.vue`.
- Kept audio-specific Vue modules for a dedicated audio migration step:
  - `AudioVisualizer.vue`
  - `SoundEffectBtn/`

## Verification
- `npm run lint` passed.
- `npm run typecheck:react` passed.
- `npm run build` passed.

## Current Vue Inventory
- Remaining `.vue` files under `src/renderer`: **15**

Remaining files:
- `src/renderer/App.vue`
- `src/renderer/components/common/AudioVisualizer.vue`
- `src/renderer/components/common/SoundEffectBtn/AddConvolutionPresetBtn.vue`
- `src/renderer/components/common/SoundEffectBtn/AddEQPresetBtn.vue`
- `src/renderer/components/common/SoundEffectBtn/AudioConvolution.vue`
- `src/renderer/components/common/SoundEffectBtn/AudioPanner.vue`
- `src/renderer/components/common/SoundEffectBtn/BiquadFilter.vue`
- `src/renderer/components/common/SoundEffectBtn/PitchShifter.vue`
- `src/renderer/components/common/SoundEffectBtn/index.vue`
- `src/renderer/components/layout/ChangeLogModal.vue`
- `src/renderer/components/layout/Icons.vue`
- `src/renderer/components/layout/PactModal.vue`
- `src/renderer/components/layout/SyncAuthCodeModal.vue`
- `src/renderer/components/layout/SyncModeModal.vue`
- `src/renderer/components/layout/UpdateModal.vue`

## Next Step
- Step 101: handle the remaining layout modal Vue files.
- Step 102: migrate or retire audio visualization and sound effect Vue components.
- Step 103: remove `src/renderer/App.vue` and old Vue entry scaffolding when no Vue component files remain.
