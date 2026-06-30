# Step 49: Player Runtime Bridge + PlayBar Integration

**日期**：2026-06-23
**范围**：播放器运行时桥接、React 播放栏接入、播放器链路 focused typecheck

## 背景

Step 48 已完成 React layout shell，但 `AppShell` footer 仍是临时播放按钮。现有 React `playerService` 还引用了不存在的 `invokeSetProgress`、`invokeSetVolume`、`invokeSetPlaybackRate` IPC key；由于 Vite build 不做完整 TS 类型检查，这类问题不会被 `build:renderer` 捕获。

## 完成内容

### 49.1 PlayerRuntimeBridge

- 在 `src/renderer-react/services/playerService.ts` 中新增 `PlayerRuntimeBridge` 接口：
  - `playMusic`
  - `playPrev`
  - `playNext`
  - `togglePlay`
  - `seek`
  - `setVolume`
  - `setMute`
  - `setPlaybackRate`
  - `onStatus`
  - `dispose`
- 删除不存在的 `invokeSetProgress`、`invokeSetVolume`、`invokeSetPlaybackRate` 调用。
- 保留已有 `playMusic`、`playPrev`、`playNext`、`togglePlay` IPC send 边界。
- `seek`、`volume`、`mute`、`playbackRate` 先通过 runtime status snapshot 与 `winMain.playerStatus` 上报，后续音频核心迁移时替换 runtime backend。
- 监听 `winMain.playerActionOnButtonClick`，把任务栏/OpenAPI 控制入口映射回 runtime status/command。

### 49.2 PlayerStore Runtime Lifecycle

- `PlayerStore` 接入 `PlayerRuntimeBridge`：
  - `hydrate()` 绑定 runtime status listener
  - `dispose()` 释放 runtime/settings listener
  - `bindRuntime()` 支持后续替换真实音频 runtime backend
- 新增 `currentTime`、`coverUrl` 和 status fallback getter。
- 从 `SettingsStore` 同步 `player.volume`、`player.isMute`、`player.playbackRate`。
- 音量在 store 内继续保持 0-1，发送给主进程的 `Coral.Player.Status.volume` 保持旧 OpenAPI/主进程使用的 0-100 口径。

### 49.3 PlayBar 接入 AppShell

- `AppShell` footer 从临时 prev/play/next 按钮替换为 React `PlayBar`。
- `PlayBar` 使用 `PlayerStore.displayName`、`displaySinger`、`coverUrl`、`currentTime`、`progress`、`maxPlayTime`。
- 修复 `ProgressBar` 未使用 import 与 cleanup lint 问题。
- 修复 `VolumeBtn` 调用不存在 `settings.saveVolumeIsMute` 的问题，改为 `player.setMute()`。
- 播放栏布局样式迁移到 `src/renderer-react/styles/index.css`，固定 footer 高度、封面尺寸、进度区域与控制区尺寸。

### 49.4 Focused Typecheck

- 新增 `tsconfig.react.json`，只检查播放器 runtime bridge 链路：
  - player service
  - player/settings stores
  - IPC client/contracts
  - Vite config
- 新增 `npm run typecheck:react`。
- 新增 `src/renderer-react/vue-compat.d.ts`，为旧 `app_setting.d.ts -> lang/i18n.ts` 类型链提供最小 Vue 类型 shim；不引入 Vue 运行时。

### 49.5 Plan Update

- 更新 `component-migration-plan.md`：
  - Step 8 标记 React PlayBar/Progress/Volume/PlaybackRate/TogglePlayMode 第一版完成。
  - Current Next Batch 改为播放器 runtime backend、PlayDetail overlay、LyricMenu、MusicComment。

## 验证结果

- Passed: targeted lint for Step 49 changed TS/TSX files:
  - `playerService.ts`
  - `playerStore.ts`
  - `rootStore.ts`
  - `AppShell.tsx`
  - player components
  - `vue-compat.d.ts`
- Passed: `npm run typecheck:react`
- Passed: `npm run build:renderer`
- Passed: `npm run build`
- Full `npm run lint`: failed on pre-existing project lint debt outside this batch, primarily historical quotes/semi/member-delimiter-style issues in settings/shared files plus older base/settings component rules. Step 49 changed files pass targeted lint.

## Next Plan

- Step 50: Replace the status-only runtime backend with a real React-accessible playback runtime:
  - decide whether to extract legacy audio plugin/core player modules or add explicit main/renderer player IPC handlers
  - make play/pause/seek/volume/rate control actual audio, not only status snapshots
  - preserve `PlayerRuntimeBridge` as the stable UI boundary
- Step 51: Port `components/layout/PlayDetail/*` to React using the same store/runtime boundary.
- Step 52: Port lyric menu and lyric selection behavior after PlayDetail shell is stable.
