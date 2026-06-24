# 2026-06-23 Step 39 - DislikeListModal + PlayTimeoutModal

## Scope

- Migrated the DislikeListModal (dislike rules editor) and PlayTimeoutModal (sleep timer) to React.
- Added a new timeoutStopService that manages the countdown timer with MobX observability.

## Completed

### 39.1 DislikeListModal
- Created `src/renderer-react/features/settings/DislikeListModal.tsx`
- Uses Ant Design `Modal` + `Input.TextArea`
- Opens with current `dislikeStore.dislikeInfo.rules` synced to local state (with trailing newline)
- Saves via `dislikeStore.overwriteDislikeMusicInfos(rules)` only when content changed
- Wired into SettingsRoutePanel as a modal host

### 39.2 timeoutStopService
- Created `src/renderer-react/services/timeoutStopService.ts`
- MobX-based `TimeoutStopStore` with `remainingSeconds` observable and `timeLabel` computed
- `start(seconds)` sets up interval (1s tick) + timeout (exit trigger)
- `clear()` cleans up both timers
- `exit()` calls `playerService.togglePlay()` to pause playback
- Exports `startTimeoutStop`, `stopTimeoutStop`, `getTimeoutLabel`, and `timeoutStopService`

### 39.3 PlayTimeoutModal
- Created `src/renderer-react/features/settings/PlayTimeoutModal.tsx`
- Uses Ant Design `Modal` + `InputNumber` (1-1440 min) + `Checkbox` (wait for play end)
- Dynamic button labels: "停止/更新" when timer running, "关闭/确认" when idle
- Input verification with regex extraction and 1440 cap (matching legacy behavior)
- Countdown label display from `timeoutStopService.store.timeLabel`
- Wired into SettingsRoutePanel "播放" section with a "设置定时停止" button

## Validation

- Passed: `npm run lint` (only pre-existing style warnings)
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Step 40: SettingOther (cache cleanup, transparent window, tray theme, clear list data).
