# Step 50: Play Detail Overlay Shell

**日期**：2026-06-23
**范围**：React 播放详情层外壳、PlayBar 入口、PlayerStore 详情状态

## 背景

Step 49 已经完成 React `PlayerRuntimeBridge` 和底部 `PlayBar` 接入，但播放详情页仍停留在旧 Vue `components/layout/PlayDetail/*`。旧实现除了详情层 UI，还包含窗口控制、歌词选择、评论、音频可视化和鼠标自动隐藏等逻辑；一次性迁移风险过大。

本批选择先迁移稳定 UI 边界：让 React 播放栏可以打开一个状态驱动的播放详情层，并复用 Step 49 的播放器 store/runtime 状态。真实音频 runtime backend、歌词菜单、评论和 fullscreen chrome parity 继续拆到后续步骤。

## 完成内容

### 50.1 PlayerStore Detail State

- 在 `src/renderer-react/stores/domains/playerStore.ts` 中新增：
  - `isPlayDetailOpen`
  - `openPlayDetail()`
  - `closePlayDetail()`
  - `togglePlayDetail()`
- 新增播放详情所需 getter：
  - `albumName`
  - `lyricText`
  - `lyricDisplayLines`
- `dispose()` 时关闭详情层，避免 runtime 释放后保留悬浮 UI。

### 50.2 React PlayDetail Overlay Shell

- 新增 `src/renderer-react/components/player/PlayDetailOverlay.tsx`。
- 从 `PlayerStore` 读取：
  - 封面
  - 歌名/歌手/专辑
  - 当前播放状态
  - 进度/时长
  - `lyricLineAllText`、`lyricLineText`、`lxlyric`、`lyric` fallback
- 复用现有 React player controls：
  - `ProgressBar`
  - `VolumeBtn`
  - `TogglePlayModeBtn`
  - `PlaybackRateBtn`
- 提供关闭按钮、封面 fallback、无歌词 empty state、桌面/窄宽度响应式布局。

### 50.3 PlayBar Entry Point

- `PlayBar` 的封面和歌曲信息区域改为按钮入口。
- 点击入口调用 `player.openPlayDetail()`。
- 保留原底部播放控制区，不改变 Step 49 的播放器 runtime boundary。

### 50.4 Styles

- 在 `src/renderer-react/styles/index.css` 中新增播放详情层样式：
  - fixed full-window overlay
  - header/cover/lyric/control grid
  - progress row
  - responsive layout under 980px
- 补充播放栏信息按钮样式和封面 icon fallback。

### 50.5 Plan Update

- 更新 `component-migration-plan.md`：
  - Step 8 标记 `components/layout/PlayDetail/*` 第一版 React overlay shell 完成。
  - Current Next Batch 改为真实 playback runtime backend、PlayDetail fullscreen/window chrome parity、LyricMenu、MusicComment。

## 验证结果

- Passed: targeted lint for Step 50 changed TS/TSX files:
  - `src/renderer-react/components/player/PlayDetailOverlay.tsx`
  - `src/renderer-react/components/player/PlayBar.tsx`
  - `src/renderer-react/components/player/index.ts`
  - `src/renderer-react/stores/domains/playerStore.ts`
- Passed: `npm run typecheck:react`
- Passed: `npm run build:renderer`
- Passed: `npm run build`
- Full `npm run lint`: failed on pre-existing project lint debt outside this batch. Current run reported 806 errors, primarily older quotes/semi/member-delimiter-style/indent rules in:
  - `src/renderer-react/components/base/*`
  - `src/renderer-react/features/settings/*`
  - `src/shared/ipc/contracts.ts`
  - Step 50 changed files pass targeted lint.

## 已知边界

- 本批没有迁移真实音频播放内核，`PlayerRuntimeBridge` 仍以 Step 49 的状态桥接为主。
- 本批没有迁移旧 Vue 详情层的 fullscreen window chrome、右键关闭、鼠标自动隐藏、音频可视化。
- 本批没有迁移 `LyricMenu.vue`、歌词选择、歌词偏移编辑。
- 本批没有迁移 `MusicComment/*`。

## Next Plan

- Step 51: Port playback runtime backend behind `PlayerRuntimeBridge`:
  - audit legacy `src/renderer/plugins/player` and `src/renderer/core/player`
  - decide extract-vs-reimplement boundary for URL resolution and HTMLAudioElement control
  - make play/pause/seek/volume/rate control actual audio, not only status snapshots
- Step 52: Port play-detail fullscreen/window chrome parity from `ControlBtnsLeftHeader.vue` and `ControlBtnsRightHeader.vue`.
- Step 53: Port lyric menu and lyric selection behavior.
- Step 54: Port play-detail comments after lyric state ownership is stable.
