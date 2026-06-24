# Step 90: List Vue Cleanup

Date: 2026-06-24

## Summary

- Removed the legacy `src/renderer/views/List/MyList` and `src/renderer/views/List/MusicList` directories.
- Replaced `src/renderer/views/List/index.vue` with a placeholder that does not render any real content (React takes over the `/list` route via `LocalListRoutePanel`).
- This deletes ~28 files (Vue templates, JS hooks, TypeScript utilities) that were only consumed by the legacy Vue list route.
- Reduced remaining Vue inventory from 71 to 67 files.
- `src/renderer/views/List` count reduced from 5 to 1 (the placeholder entry).

## Changed Files

- `src/renderer/views/List/index.vue` — replaced with empty placeholder.
- `src/renderer/views/List/MyList/` — fully removed.
- `src/renderer/views/List/MusicList/` — fully removed.
- `skills/coral-music-desktop/references/component-migration-plan.md` — inventory and status updated.

## Validation

- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

1. Port drag/reorder for the selected music list as the final List interaction feature.
2. After drag/reorder is stable, remove `src/renderer/views/List/index.vue` completely.
3. Continue with SongList, Leaderboard, Download, Search, and Layout component migration.
