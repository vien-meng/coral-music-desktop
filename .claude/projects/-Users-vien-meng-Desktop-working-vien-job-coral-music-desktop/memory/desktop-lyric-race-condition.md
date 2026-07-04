---
name: desktop-lyric-race-condition
description: MessagePort 竞态条件导致桌面歌词显示为透明
metadata:
  type: feedback
---

**问题：** 桌面歌词窗口已创建但看不见，因为 `desktopLyricService` 注册端口监听器太晚，
歌词窗口发起的 MessageChannel 连接中 port1 丢失。

**时间线：**
1. `providers.tsx` 的 `useEffect` 中先等 `rootStore.initialize()`
2. `initialize()` 内部 `settings.hydrate()` 在第46行发送 `inited` IPC → 触发创建歌词窗口
3. 歌词窗口发 `request_main_window_channel` → 主进程创建 MessageChannel → port1 发给主窗口
4. **此时 `desktopLyricService.start()` 还没执行** → port1 无人接收，连接丢失
5. 歌词窗口的 `isPlay` 永远 `false` → `pauseHide: true` → `opacity: 0.05` → 窗口透明

**修复：**
在 `rootStore.initialize()` 执行之前就调用 `desktopLyricService.start()`，
只需 store 引用（构造时已有），不需等数据注入。MobX reaction 只观测变化，提前注册安全。

- 修改文件：`src/renderer-react/app/providers.tsx`
- 修改内容：将 `desktopLyricService.start()` 移到 `rootStore.initialize()` 之前

**关联文件：**
- [[desktopLyricService]] 主窗口渲染进程的端口服务
- [[lyricRootStore]] 歌词窗口状态管理，含 `shouldHide` / `syncPauseHideState`
