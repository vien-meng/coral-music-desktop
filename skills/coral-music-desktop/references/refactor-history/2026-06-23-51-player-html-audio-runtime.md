# Step 51: Player HTMLAudio Runtime Backend

**日期**：2026-06-23
**范围**：播放器 runtime backend 拆分、本地文件 HTMLAudioElement 播放链路

## 背景

Step 49 的 `PlayerRuntimeBridge` 解决了 React 播放器 UI 的服务边界问题，但 seek/volume/rate 仍主要是 status snapshot，并不驱动真实音频。Step 50 已经把播放详情层接到同一个 store/runtime 状态上，所以继续推进播放器核心时需要先让 runtime backend 可替换，而不是把旧 Vue 播放核心直接搬进 React。

旧 `src/renderer/core/player/action.ts` 的完整播放链路牵涉：

- legacy Vue player/list stores
- `window.coral.worker`
- `window.app_event`
- `window.i18n`
- 在线源 URL 解析、缓存、源切换和错误重试

本批先迁移最小可运行边界：抽出 React runtime 类型和后端目录，新增本地文件可播放的 `HTMLAudioElement` backend。在线 URL 解析、下载任务播放和 playlist-aware next/prev 拆到后续批次。

## 完成内容

### 51.1 Runtime Types

- 新增 `src/renderer-react/services/playerRuntime/types.ts`。
- 从 `playerService.ts` 拆出并复用：
  - `PlayerRuntimeStatus`
  - `PlayerStatusListener`
  - `PlayerRuntimeBridge`
- `playerService.ts` 继续 re-export 这些类型，保持 `PlayerStore` 现有 import 不变。

### 51.2 Local URL Resolver

- 新增 `src/renderer-react/services/playerRuntime/musicUrlResolver.ts`。
- 提供 `resolveLocalMusicUrl()`：
  - 仅支持 `musicInfo.source === 'local'`
  - 读取 `musicInfo.meta.filePath`
  - 使用现有 `encodePath()` 保持旧本地路径编码行为
- 保留 `canPlayWithLocalRuntime()` 给后续 UI/状态提示使用。

### 51.3 HTMLAudio Runtime Backend

- 新增 `src/renderer-react/services/playerRuntime/htmlAudioRuntime.ts`。
- 新增 `HtmlAudioPlayerRuntimeBackend`：
  - 创建私有 `window.Audio()` 实例
  - 支持本地歌曲 `playMusic()`
  - 支持 `togglePlay()`
  - 支持 `seek()`
  - 支持 `setVolume()`
  - 支持 `setMute()`
  - 支持 `setPlaybackRate()`
  - 监听 `playing/pause/ended/error/loadedmetadata/durationchange/timeupdate/volumechange/ratechange`
  - 将真实 audio 状态发布为 `Coral.Player.Status` partial snapshot
  - `dispose()` 清理 audio listeners 和 src

### 51.4 PlayerService Backend Delegation

- `playerService.ts` 从状态模拟改为 IPC shell + runtime backend：
  - React UI command 仍调用既有 player IPC send，保留未来主进程/旧兼容入口
  - 实际 seek/volume/mute/rate/play/toggle 交给 backend
  - backend status 统一通过 `sendPlayerStatus()` 同步给主进程，并通知 `PlayerStore`
- 任务栏 `playerActionOnButtonClick` 继续进入同一 `PlayerRuntimeBridge`，pause 动作现在会尝试暂停真实 backend。

## 验证结果

- Passed: targeted lint for Step 51 changed runtime files:
  - `src/renderer-react/services/playerService.ts`
  - `src/renderer-react/services/playerRuntime/types.ts`
  - `src/renderer-react/services/playerRuntime/musicUrlResolver.ts`
  - `src/renderer-react/services/playerRuntime/htmlAudioRuntime.ts`
  - `src/renderer-react/stores/domains/playerStore.ts`
- Passed: `npm run typecheck:react`
- Passed: `npm run build:renderer`
- Passed: `npm run build`
- Full `npm run lint`: failed on pre-existing project lint debt outside this batch. Current run reported 806 errors, primarily older quotes/semi/member-delimiter-style/indent rules in:
  - `src/renderer-react/components/base/*`
  - `src/renderer-react/features/settings/*`
  - `src/shared/ipc/contracts.ts`
  - Step 51 changed files pass targeted lint.

## 已知边界

- 本批只支持 `source === 'local'` 的本地文件 URL。
- 在线源、下载任务、缓存 URL、源切换、错误重试还没有迁入 React runtime。
- `playNext()` / `playPrev()` 仍保留 IPC 发送和 backend no-op，尚未接入 React playlist state。
- 旧音效链路如 EQ、混响、pitch shifter、输出设备切换没有迁移。
- React runtime 仍保留 `contextIsolation: false` 时代的 IPC shell；后续可继续收紧。

## Next Plan

- Step 52: Port online/download playback URL resolution:
  - isolate old `getMusicUrl()` dependencies
  - introduce React `musicPlaybackResolver` service
  - keep cached URL writes behind typed IPC/service calls
- Step 53: Port playlist-aware prev/next behavior into `PlayerStore` + runtime command boundary.
- Step 54: Port PlayDetail fullscreen/window chrome parity.
- Step 55: Port lyric menu and lyric selection behavior.
