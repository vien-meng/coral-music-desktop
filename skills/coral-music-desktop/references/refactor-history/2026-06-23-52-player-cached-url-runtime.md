# Step 52: Player Cached URL Runtime Boundary

**日期**：2026-06-23
**范围**：播放器缓存 URL typed IPC、React cache service、runtime URL resolver

## 背景

Step 51 已经让 React 播放器 runtime 可以通过 `HTMLAudioElement` 播放本地音乐文件，但在线歌曲仍没有 React 可用的 URL 解析边界。旧 Vue 播放链路会先按 `${musicInfo.id}_${quality}` 查询主进程缓存 URL，再通过在线 SDK 拉取新 URL，并写回缓存。

本批不直接迁移在线 SDK 拉流逻辑；先补齐 React typed IPC 和缓存 URL resolver，让 runtime 能播放“已经缓存过的在线 URL”。这样后续迁移 fresh online URL fetching 时，可以复用同一个 resolver/cache service，而不再从 UI 直接碰旧 Vue 工具。

## 完成内容

### 52.1 Typed IPC Contracts

- 在 `src/shared/ipc/contracts.ts` 中补充 React 可用的 channel：
  - `ipcChannels.winMain.getMusicUrl`
  - `ipcChannels.winMain.saveMusicUrl`
- 补充 invoke map：
  - `getMusicUrl`: `IpcContract<string, string>`
  - `saveMusicUrl`: `IpcContract<Coral.Music.MusicUrlInfo, void>`
- 复用既有主进程 handler：
  - `WIN_MAIN_RENDERER_EVENT_NAME.get_music_url`
  - `WIN_MAIN_RENDERER_EVENT_NAME.save_music_url`

### 52.2 React Cache Service

- 扩展 `src/renderer-react/services/cacheService.ts`：
  - `createMusicUrlCacheKey(musicInfo, quality)`
  - `getCachedMusicUrl(musicInfo, quality)`
  - `saveCachedMusicUrl(musicInfo, quality, url)`
- 保持旧缓存 key 规则：`${musicInfo.id}_${quality}`。

### 52.3 Runtime Resolver

- 扩展 `src/renderer-react/services/playerRuntime/musicUrlResolver.ts`：
  - `ResolvedPlaybackUrl`
  - `ResolvePlayableMusicUrlOptions`
  - `getPreferredPlayQuality()`
  - `resolvePlayableMusicUrl()`
- Resolver 当前支持：
  - local file path -> encoded local URL
  - online music with cached URL -> cached URL
- Resolver 当前不支持：
  - fresh online SDK URL fetching
  - download task URL resolving
  - source toggling

### 52.4 HTMLAudio Backend Async Loading

- `HtmlAudioPlayerRuntimeBackend.playMusic()` 改为异步 URL 解析：
  - 发布歌曲 metadata
  - 创建 load request id，避免旧请求覆盖新歌
  - 调用 `resolvePlayableMusicUrl()`
  - 成功时设置 audio src 并播放
  - 无 URL 时发布 `status: 'stoped'`

## 验证结果

- Passed: targeted lint for Step 52 changed React files:
  - `src/renderer-react/services/cacheService.ts`
  - `src/renderer-react/services/playerRuntime/musicUrlResolver.ts`
  - `src/renderer-react/services/playerRuntime/htmlAudioRuntime.ts`
  - `src/renderer-react/services/playerService.ts`
- Passed: `npm run typecheck:react`
- Passed: `npm run build:renderer`
- Passed: `npm run build`
- Full `npm run lint`: failed on pre-existing project lint debt outside this batch. After adjusting the newly added contract lines to avoid new lint debt, the run is back to 806 errors, primarily older quotes/semi/member-delimiter-style/indent rules in:
  - `src/renderer-react/components/base/*`
  - `src/renderer-react/features/settings/*`
  - `src/shared/ipc/contracts.ts`

## 已知边界

- 本批只播放已有缓存 URL；没有缓存时在线歌曲仍无法开始播放。
- 缓存 URL 的有效性没有主动校验；若 URL 过期，audio 会进入 error 状态，fresh fetching 仍需下一批补齐。
- `saveCachedMusicUrl()` 已接入 typed IPC，但当前 runtime 还没有 fresh URL source 会调用它。
- 仍未迁移 playlist-aware prev/next。

## Next Plan

- Step 53: Port fresh online URL fetching:
  - extract `handleGetOnlineMusicUrl` dependencies from `src/renderer/core/music/utils.ts`
  - isolate SDK call + quality selection + retry/source toggle without Vue store
  - write fetched URL via `saveCachedMusicUrl()`
- Step 54: Port playlist-aware prev/next behavior.
- Step 55: Port PlayDetail fullscreen/window chrome parity.
- Step 56: Port lyric menu and lyric selection behavior.
