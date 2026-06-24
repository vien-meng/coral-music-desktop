# Steps 95-97: Leaderboard, Search Routes — PlaceholderRoute Removal, Full List Display

## Step 95: Leaderboard Route
- Removed `PlaceholderRoute` wrapper from `LeaderboardRoute` in `routeConfig.tsx`.
- Enhanced `LeaderboardRoutePanel.tsx`:
  - Added board sidebar + detail content side-by-side layout with scroll.
  - Added view mode toggle (`Segmented`: 榜单/歌曲).
  - Shows the full music list (not just 8 items preview).
  - Board list on the left, selected board's music detail on the right.
  - Errors displayed as closable alerts.

## Step 96: Search Route
- Removed `PlaceholderRoute` wrapper from `SearchRoute` in `routeConfig.tsx`.
- Enhanced `SearchRoutePanel.tsx`:
  - Full-page layout with scrollable results.
  - Shows full music list or song list (not just 8 items preview).
  - Preserved all controls: type segmented, source select, search input, pager.

## Step 97: Cleanup
- Verified no unused imports remain in `routeConfig.tsx`.
- `PlaceholderRoute` component still present and used by `LocalListRoute` and `SettingRoute`.

## Build Results
- `npm run lint` — clean
- `npm run typecheck:react` — clean
- `npm run build` — all targets pass

## State After Steps 95-97
| Route | Status |
|-------|--------|
| Search | ✅ PlaceholderRoute removed |
| Song List | ✅ PlaceholderRoute removed |
| Leaderboard | ✅ PlaceholderRoute removed |
| Download | ✅ PlaceholderRoute removed |
| List (My List) | ⏳ Still wrapped (drag reorder pending, Vue List views deleted) |
| Setting | ✅ PlaceholderRoute removed (previously) |

## Vue Files Remaining
| Area | Count | Notes |
|------|-------|-------|
| `renderer/components/layout` | 21 | PlayBar, PlayDetail, modals |
| `renderer/components/common` | 16 | Audio visualizer, download modals, etc. |
| `renderer/components/material` | 7 | Online list components |
| `renderer/views/Leaderboard` | 3 | Dead code |
| `renderer/views/Search` | 4 | Dead code |
| `renderer/views/Download` | 1 | Dead code |
| `renderer/views/List` | 1 | index.vue placeholder |
| Other | ~8 | App.vue, Icons, etc. |

**Total: ~61**

## Next Steps
The next major milestone is the **Player Bar / PlayDetail** (Step 8 in component-migration-plan.md). This is the always-visible UI surface and includes:
- `PlayBar/` (5 Vue files) — play controls, progress, volume
- `PlayDetail/` (6+ Vue files) — full player UI with lyrics, comments
- Sound effects and audio visualization

However, a more practical next step may be removing the remaining PlaceholderRoute from `LocalListRoute` and `SettingRoute`, then tackling the list/index.vue Vue placeholder.
