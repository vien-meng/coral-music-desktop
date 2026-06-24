# Step 93: SongList Route — Remove PlaceholderRoute, Delete Vue SongList Views

## Summary
- Removed `PlaceholderRoute` wrapper from `SongListRoute` in `routeConfig.tsx` — SongList now renders directly as a full page without the "待迁移" card.
- Deleted `src/renderer/views/songList/` directory (7 Vue files):
  - `Detail/index.vue`
  - `List/index.vue`, `ListView.vue`
  - `List/components/TagList.vue`
  - `List/components/SortTab.vue`
  - `List/components/SongList.vue`
  - `List/components/OpenListModal.vue`
- **Not deleted**: Vue store files (`src/renderer/store/songList/action.ts`, `state.ts`) — still imported by legacy Vue core modules (search, list sync, play-songlist composition).

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
| `renderer/views/Download` | 1 | Download route |
| `renderer/views/List` | 1 | index.vue placeholder |
| Other (App.vue, Icons, etc.) | ~8 | |

**Total: ~61** (down from 76 at session start)

## Next Steps
The next major surface should be **Download** (`src/renderer/views/Download/index.vue` + `DownloadModal.vue` + `DownloadMultipleModal.vue`) — it's a complete standalone workflow and has a React side with partial implementation. This also enables removal of ~3+ common components.
