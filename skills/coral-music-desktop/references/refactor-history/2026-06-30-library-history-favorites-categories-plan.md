# Library History, Favorites, And Categories Plan

Date: 2026-06-30

## Summary

- Add a Coral Music library domain for playback history, favorites, and music categories.
- Playback history and category grouping cover every track that has been played.
- Favorites get a dedicated page with song, song-list, and album tabs.
- Song favorites remain compatible with the existing `love` list.

## Implementation Plan

- Add `Coral.Library` types for play records, favorite song-list snapshots, favorite album snapshots, and category groups.
- Add SQLite tables for `play_history`, `favorite_songlist`, and `favorite_album`, plus DB migration support.
- Add dbService modules and typed IPC for history, favorites, and category queries.
- Record play history from `PlayerStore.playMusic`, capped at 1000 most recent entries.
- Add Favorites and Library routes.
- Add renderer services/stores for library data.
- Add UI for playback history, category groups, favorite songs, favorite song lists, favorite albums, and create-list/add-to-list flows.
- Add `smoke:library-capabilities` to pin schema, IPC, routes, store wiring, and UI entry points.

## Continuation Notes

- Added reusable `FavoriteSongBtn` and wired it into the play bar, play detail overlay, and shared row actions.
- Favorite song actions now operate through the existing `love` list from all common song surfaces.
- Updated `smoke:library-capabilities` so the favorite button surface is guarded.

## Boundaries

- Favorite songs use the existing `love` list instead of a duplicate table.
- Favorite album detail is stored as a snapshot; complete online album APIs are not guaranteed for every source.
- Genre classification uses available metadata first and falls back to source/extension/quality grouping.

## Verification

```bash
npm run smoke:library-capabilities
npm run typecheck:react
npx tsc -p src/main/tsconfig.json --noEmit --pretty false
npm run build:main
npm run build:renderer
git diff --check
```
