# Step 101: Layout Vue Cleanup

## Summary
- Deleted remaining legacy Vue layout components:
  - `src/renderer/components/layout/ChangeLogModal.vue`
  - `src/renderer/components/layout/Icons.vue`
  - `src/renderer/components/layout/PactModal.vue`
  - `src/renderer/components/layout/SyncAuthCodeModal.vue`
  - `src/renderer/components/layout/SyncModeModal.vue`
  - `src/renderer/components/layout/UpdateModal.vue`
- These components are not referenced by the React/Vite renderer path.
- Settings/sync/update related surfaces are now handled in React settings services and panels.

## Verification
- `npm run lint` passed.
- `npm run typecheck:react` passed.
- `npm run build` passed.

## Current Vue Inventory
- Remaining `.vue` files under `src/renderer`: **9**

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

## Next Step
- Step 102: migrate or retire the sound-effect/audio-visualizer Vue components.
- Step 103: remove the final Vue root component and Vue-only scaffolding once audio modules are handled.
