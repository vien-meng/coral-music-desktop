# 2026-06-23 Step 08 - Lyric Hide Behavior

## Scope

- Migrated desktop lyric hover-hide and pause-hide behavior from the Vue lyric renderer into the React/MobX lyric renderer.
- Kept the legacy winLyric IPC/config keys unchanged:
  - `desktopLyric.isHoverHide`
  - `desktopLyric.pauseHide`
  - `winLyric__send_mouse_enter_leave`
  - `winLyric__on_mouse_enter_leave`

## Completed

- Added `LyricRootStore.shouldHide` so React rendering can combine hover-hide and pause-hide state in one place.
- Added delayed pause-hide state with the same 200ms delay used by `src/renderer-lyric/useApp/usePauseHide.ts`.
- Reused the existing mouse enter/leave service bridge for hover-hide state, including main-process mouse-check events when the window is locked.
- Moved lyric opacity from inline `opacity` to `--lyric-opacity` so hide-state classes can override visibility without losing the user opacity setting.
- Updated `src/lyric-react/App.tsx` to apply the `hidden` shell class from MobX state.
- Updated the component migration plan to mark `useHoverHide.ts` and `usePauseHide.ts` as migrated.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer-lyric`
- Passed: `npm run build`

## Next Plan

- Port `useTheme.ts` / `useCommon.ts` details that are still useful in React.
- Port `AudioVisualizer.vue` using the existing typed MessageChannel action `get_analyser_data_array`.
- Continue reducing legacy `renderer-lyric` dependencies only after the React lyric window reaches behavior parity.
