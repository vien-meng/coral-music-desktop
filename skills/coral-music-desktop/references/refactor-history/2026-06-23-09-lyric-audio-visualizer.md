# 2026-06-23 Step 09 - Lyric Audio Visualizer

## Scope

- Migrated `src/renderer-lyric/components/common/AudioVisualizer.vue` into the React lyric renderer.
- Preserved the legacy MessageChannel action pair:
  - `get_analyser_data_array`
  - `send_analyser_data_array`

## Completed

- Added `src/lyric-react/components/common/AudioVisualizer.tsx`.
- Added `src/lyric-react/components/common/index.ts`.
- Added MobX state for transferred analyser data in `LyricRootStore`.
- Added `LyricRootStore.isAudioVisualizationActive` and `requestAnalyserData()` so the component can keep the old one-frame-at-a-time request loop.
- Rendered the visualizer from `src/lyric-react/App.tsx` when `desktopLyric.audioVisualization` is enabled.
- Added CSS layering so the canvas stays under lyric text and never captures pointer events.
- Updated the component migration plan to mark `AudioVisualizer.vue` as migrated.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer-lyric`
- Passed: `npm run build`

## Next Plan

- Port the remaining useful `useTheme.ts` and `useCommon.ts` behavior into React services/hooks.
- Review `layout/Icons.vue` parity and decide whether any tray/status icons still need a React equivalent beyond the control bar.
- Keep legacy `renderer-lyric` sources until the React lyric window has runtime parity in Electron.
