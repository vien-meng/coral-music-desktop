# Step 102: Audio Visualizer React Migration

## Summary
- Added optional `getAnalyser()` to `PlayerRuntimeBridge`.
- Implemented WebAudio analyser support in `HtmlAudioPlayerRuntimeBackend`:
  - Lazily creates `AudioContext`.
  - Connects `HTMLAudioElement -> AnalyserNode -> destination`.
  - Resumes the audio context during playback when suspended.
  - Disposes the graph when runtime is disposed.
- Added React `AudioVisualizer.tsx`:
  - Draws frequency bars to canvas.
  - Uses `player.getAnalyser()` and MobX `player.isPlaying`.
  - Reuses the old Vue frequency-bar rendering behavior in hook form.
- Mounted `AudioVisualizer` into `PlayDetailOverlay`.
- Added global CSS for `.coral-audio-visualizer`.
- Deleted old Vue `src/renderer/components/common/AudioVisualizer.vue`.

## Verification
- `npm run lint` passed.
- `npm run typecheck:react` passed.
- `npm run build` passed.

## Current Vue Inventory
- Remaining `.vue` files under `src/renderer`: **8**

Remaining files:
- `src/renderer/App.vue`
- `src/renderer/components/common/SoundEffectBtn/AddConvolutionPresetBtn.vue`
- `src/renderer/components/common/SoundEffectBtn/AddEQPresetBtn.vue`
- `src/renderer/components/common/SoundEffectBtn/AudioConvolution.vue`
- `src/renderer/components/common/SoundEffectBtn/AudioPanner.vue`
- `src/renderer/components/common/SoundEffectBtn/BiquadFilter.vue`
- `src/renderer/components/common/SoundEffectBtn/PitchShifter.vue`
- `src/renderer/components/common/SoundEffectBtn/index.vue`

## Next Step
- Step 103: SoundEffectBtn migration.
  - This requires runtime-level WebAudio graph controls, not just a UI port.
  - Likely scope: EQ biquad filters, panner, pitch shifter, convolution presets, and settings persistence.
