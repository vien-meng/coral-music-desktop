# Step 92: SongList Route — Full List View with Card Grid, Tag Popover, Open List Modal

## Summary
- Completed the SongList route full list view, replacing the limited preview (8 items) with a full card grid.
- New components created:
  - `TagPopover.tsx` — full tag group browser (equivalent to Vue's TagList.vue): popover with hot tags, grouped tag categories, default tag option.
  - `OpenListModal.tsx` — import song list by URL/name (equivalent to Vue's OpenListModal.vue): source selector, text input, FAQ link.
- Enhanced `SongListRoutePanel.tsx`:
  - Replaced `OnlineTagCloud` with `TagPopover` for full tag browsing.
  - Replaced `OnlineSongListPreviewList` with a card grid (`Card` components with cover images).
  - Full detail section with header (image, title, desc, play button, collect button, close).
  - Scroll position memory (save/restore per source+sort+tag combination).
  - Import button to open `OpenListModal`.
  - Error alerts with close buttons.
  - Uses existing `OnlinePager`, `OnlineMusicPreviewList`, `OnlineMusicRowActions` for detail music list.
- Added CSS classes to `src/renderer-react/styles/index.css`:
  - `.coral-song-list-grid`, `.coral-song-list-card`, `.coral-song-list-card-cover`
  - `.coral-tag-popover-trigger`, `.coral-tag-item`, `.coral-tag-item-btn`
  - `.coral-detail-section`, `.coral-link-text`
- Keep Vue files: `src/renderer/views/songList/` still present as legacy reference.

## Build Results
- `npm run lint` — clean
- `npm run typecheck:react` — clean
- `npm run build` — all targets (renderer, renderer-lyric, renderer-scripts, main) pass

## Remaining Vue songList files (7)
- `src/renderer/views/songList/Detail/index.vue` — detail view
- `src/renderer/views/songList/List/index.vue` — list entry
- `src/renderer/views/songList/List/components/TagList.vue`
- `src/renderer/views/songList/List/components/SortTab.vue`
- `src/renderer/views/songList/List/components/SongList.vue`
- `src/renderer/views/songList/List/components/OpenListModal.vue`
- `src/renderer/views/songList/List/ListView.vue`

## Next Steps (Step 93)
1. Complete the SongList route in `routeConfig.tsx`:
   - Remove `PlaceholderRoute` wrapper for SongList.
   - Route to use `SongListRoutePanel` as full page without placeholder card.
2. Validate that detail interaction (play, collect) works end-to-end.
3. Clean up Vue songList files after parity is confirmed.
