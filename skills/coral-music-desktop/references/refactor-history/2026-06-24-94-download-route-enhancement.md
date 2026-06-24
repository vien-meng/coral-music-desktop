# Step 94: Download Route — Full Service, Tab Filtering, Route Cleanup

## Summary
- Removed `PlaceholderRoute` wrapper from `DownloadRoute` in `routeConfig.tsx` — download now renders as a full page.
- Rewrote `downloadService.ts` from placeholder stub to real implementation:
  - `getDownloadTasks()` — calls `ipcChannels.winMain.downloadListGet`
  - `createDownloadTasks()` — creates via legacy worker, persists via IPC
  - `removeDownloadTasks()` — removes from legacy worker + IPC
  - `clearDownloadTasks()`, `openDownloadTaskFile()`, `startDownloadTask()`, `pauseDownloadTask()`
- Enhanced `DownloadRoutePanel.tsx`:
  - **Tab filtering** via `Segmented` (全部 / 下载中 / 已完成 / 暂停 / 错误)
  - **Progress bar** with speed display
  - **Quality tag** (FLAC Hires support)
  - **Error state** styling (red progress bar, exception status)
  - Improved action buttons — all previous controls kept
- Keeps Vue files: `src/renderer/views/Download/index.vue` still exists as dead code (not built).
- Keeps common download modals (`DownloadModal.vue`, `DownloadMultipleModal.vue`) — still referenced by Vue OnlineList.

## Build Results
- `npm run lint` — clean
- `npm run typecheck:react` — clean
- `npm run build` — all targets pass

## Vue Files Remaining
| Area | Count | Notes |
|------|-------|-------|
| `renderer/components/layout` | 21 | PlayBar, PlayDetail, modals |
| `renderer/components/common` | 16 | Audio visualizer, download modals, list modals, playback controls |
| `renderer/components/material` | 7 | Online list components |
| `renderer/views/Leaderboard` | 3 | Leaderboard route |
| `renderer/views/Search` | 4 | Search route |
| `renderer/views/Download` | 1 | Dead code (not built) |
| `renderer/views/List` | 1 | index.vue placeholder |
| Other (App.vue, Icons, etc.) | ~8 | |

**Total: ~61**

## Next Steps
Next major surface priority:
1. **Search route** (`src/renderer/views/Search/`, 4 Vue files) — has React counterpart `SearchRoutePanel`
2. **Leaderboard route** (`src/renderer/views/Leaderboard/`, 3 Vue files) — has React counterpart
3. **Player Bar / PlayDetail** (21 layout Vue files) — always-visible surface, complex but high impact
