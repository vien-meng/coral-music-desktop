# Step 103: Sound Effect React Migration

## Summary
- Added React `SoundEffectBtn.tsx` and mounted it in:
  - `PlayBar`
  - `PlayDetailOverlay`
- Implemented first React sound-effect controls:
  - 10-band EQ sliders: 31, 62, 125, 250, 500, 1k, 2k, 4k, 8k, 16k
  - EQ reset action
  - Stereo panner enable + left/right position slider
  - Pitch playback-rate slider
- Extended player runtime sound-effect boundary:
  - Added `PlayerSoundEffectConfig`.
  - Added optional `setSoundEffectConfig()` to `PlayerRuntimeBridge`.
  - Rebuilt HTMLAudio WebAudio graph as:
    `HTMLAudioElement -> BiquadFilterNode[] -> StereoPannerNode -> AnalyserNode -> destination`
  - Settings reaction now syncs EQ, panner, and pitch settings into the runtime.
- Deleted old Vue sound effect directory:
  - `src/renderer/components/common/SoundEffectBtn/`

## Scope Notes
- This batch covers the most important runtime-backed controls: EQ, panner, pitch.
- Legacy convolution preset UI is not fully ported in this batch. The old Vue implementation was removed because the Vite React renderer no longer uses it; a future React convolution preset panel can be added on top of the runtime boundary.

## Verification
- `npm run lint` passed.
- `npm run typecheck:react` passed.
- `npm run build` passed.

## Current Vue Inventory
- Remaining `.vue` files under `src/renderer`: **1**
  - `src/renderer/App.vue`

## Next Step
- Step 104: delete final Vue root component and remove/neutralize remaining `.vue` references.
