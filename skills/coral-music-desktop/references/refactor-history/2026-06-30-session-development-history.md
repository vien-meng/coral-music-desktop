# Coral Music Development History

> Last updated: 2026-06-29

This note records the practical implementation history from the recent Codex session so future development can resume without reconstructing the context from chat logs.

## Product Identity And Migration

- Replaced remaining LX Music-facing product labels with Coral Music / 珊瑚音乐 in the React desktop UI and shared branding paths.
- Refactored project variables and namespaces from old inherited naming to Coral-oriented names.
- Preserved `lxlyric` naming because it refers to the lyric/word-timing format rather than product identity.
- Renamed data directory compatibility names to Coral naming.
- Preserved LX compatibility globals and User API concepts where they are part of third-party source compatibility, not product branding.
- Added Chinese source display mapping for online platforms so users see readable names such as 酷我音乐, 酷狗音乐, QQ音乐, 网易云音乐, 咪咕音乐, rather than `KW/KG/TX/WY/MG`.

## User API / Online Playback

- Added LX User API compatibility for imported external source scripts.
- Added User API import entry points for local file import and online import.
- User API management UI now shows enabled state, current source, supported platforms, supported qualities, and clearer status badges.
- Verified User API state is persisted/reused so the same source does not need to be revalidated on every restart unless explicitly refreshed.
- Normalized common User API `musicUrl` return shapes, including string URLs, `{ url }`, and nested `{ data: { url, type } }`.
- Added broader quality support and downgrade order: `master -> atmos_plus -> atmos -> hires -> flac24bit -> flac -> 320k -> 192k -> 128k`.
- Improved current-source status display so verified source state can be reused instead of repeatedly showing "待检测".
- Added clearer errors for missing or disabled User API source instead of generic "Api is not found".
- Fixed dynamic import/cache issues around FLAC decoder dependencies where Vite optimized deps could return 504.

## Local Audio Playback And Lyrics

- Restored local audio path so local files do not enter User API or online-quality switching logic.
- Moved local metadata-sensitive work away from renderer-only browser imports that caused `@eshaz/web-worker ... does not provide an export named default`.
- Kept local FLAC browser playback first and decoder fallback second.
- Added local `.lrc` discovery priority for same-directory lyrics:
  - same basename
  - `artist - title`
  - `title - artist`
  - title-only
  - fuzzy directory match
- If no usable local LRC exists, the player attempts online lyric lookup using current SDK/User API capability.

## Playback Detail Page

- Added online cover and lyric enrichment after playback starts.
- Added playback quality switch in the play detail page.
- Replaced raw LRC display with parsed lyric rendering; metadata tags and word timing tags are hidden.
- Added auto-scroll and karaoke-style highlighting for supported `lxlyric`.
- Fixed stale source error cards so successful playback clears old error text.
- Improved progress bar contrast in light theme.
- Added minimize, maximize/restore, fullscreen, and close controls in play detail view.

## Window Drag And Clickability

- Removed oversized Electron drag regions that covered top actions, search controls, filters, pagination, and sidebar buttons.
- Kept only a narrow top drag strip for the main window.
- Forced core interactive regions and AntD controls to `-webkit-app-region: no-drag`.
- Preserved play-detail header dragging only while play detail is open.

## Settings And General UI

- Reworked settings page scrolling so lower settings are reachable.
- Lightly redesigned settings and local music pages toward a cleaner Coral Music visual style.
- Added local file and source-entry buttons to the top toolbar so users have obvious entry points for local audio and User API sources.
- Refined toolbar/action button widths in song-list and leaderboard pages so labels are less likely to truncate.
- Reduced visual clutter in repeated list/card surfaces while keeping dense music-management workflows usable.

## Navigation And Route Behavior

- Default route changed from Search to Leaderboard so app startup shows useful content instead of an empty search page.
- Added short route-transition lock in `UiStore` to prevent rapid repeated route switching.
- Added `UiStore` global loading state and `withGlobalLoading` wrapper for interactions that should block repeated clicks.
- Left sidebar route switching now shows a full-app loading overlay instead of silently changing route state.
- Sidebar menu and header quick actions are disabled during this transition.
- Header global search ignores submissions while route transition is active.
- Header global search now switches to Search and immediately submits the query instead of only filling the route-local search input.
- Search route type/source/page changes now re-submit automatically when a query already exists, so switching between music and song-list results does not require pressing Search again.

## Search, Song List, And Leaderboard

- Search result source labels now use Chinese names.
- Search results and leaderboard/song-list lists were expanded to fill available page height instead of being capped at `360px`.
- Song-list search results now use the same card grid visual pattern as Song List Square.
- Page input width was reduced for default pages and still expands for multi-digit pages; text is centered.
- Song List Square now auto-loads default hot/recommended lists on first entry.
- Song list detail opens as its own tab-like detail view rather than expanding below the grid.
- Song list card selection now uses the full-app loading overlay instead of turning the clicked card into a local skeleton.
- Song list detail "播放全部" now really replaces the current play queue and starts from the first song on the currently loaded page.
- Leaderboard now auto-loads default boards and first board detail.
- Leaderboard board title shows the readable board name instead of internal IDs such as `kw__93`.
- Leaderboard `viewMode` moved into `LeaderboardStore` so switching away and back keeps the current board/song view.
- Leaderboard left board list and right song list were made independently scrollable through the full available height.
- Leaderboard added "播放全部" for the currently loaded board page.
- Song-list and leaderboard detail loading now reject repeated concurrent detail loads.
- Song-list cards show loading during detail entry and ignore repeated clicks while loading.
- Leaderboard board buttons are disabled while a board detail is loading.

## Playback Queue

- Added `PlayerStore.queueItems` and `PlayerStore.currentQueueMusicId` getters for safe UI access.
- Added shared `PlayQueueBtn` component.
- Initially implemented as a popover, then changed to a right-side full-height Drawer.
- Queue drawer shows:
  - queue count
  - song name
  - singer
  - source / local / download label
  - duration
  - current playing item highlight
- Clicking a queue item calls `player.playFromQueue(item, player.queueItems, player.currentQueueId)` and preserves the queue.
- Queue button is available in both the bottom play bar and play detail toolbar.
- Queue drawer button has a short opening loading state to avoid repeated click jitter.

## Downloads

- Download filename template compatibility was fixed:
  - current default `歌名 - 歌手`
  - old `%title% - %artist%`
- Single and batch download creation now use the user download filename setting.
- Download creation now immediately starts tasks after adding them, instead of requiring the user to click "start".
- Download tasks reuse playback URL resolution and quality fallback.
- Download quality extension policy:
  - lossless/high qualities default to `.flac`
  - lossy qualities default to `.mp3`
- Download list statistics were corrected:
  - total task count
  - completed count
  - running count / max concurrency
  - waiting count from task state
  - current selected count / current visible list count
- Switching download tabs clears selection to avoid hidden selected tasks affecting button state.
- Selection is cleaned when refreshed tasks no longer contain old IDs.

## WebDAV Cloud Playback Plan And First Implementation

- Added implementation plan at `skills/coral-music-desktop/references/refactor-history/2026-06-30-webdav-cloud-playback-plan.md`.
- First version intentionally supports user-provided WebDAV endpoints only; Baidu, Xunlei, Quark, Aliyun, 115, Tianyi, UC, and custom providers are presets/display labels, not bundled official cloud-drive APIs.
- Added WebDAV settings/types:
  - `Coral.WebDav.Provider`
  - `Coral.WebDav.Account`
  - `Coral.WebDav.SafeAccount`
  - `Coral.WebDav.FileItem`
  - `Coral.Music.MusicInfoWebDav`
  - `webdav.accounts`
  - `webdav.activeAccountId`
  - `webdav.proxy.enabled`
- Added WebDAV IPC:
  - account list/save/remove/test
  - directory listing
  - short-lived stream URL create/revoke
- Added main-process `webDavService`:
  - stores accounts through app settings
  - performs PROPFIND directory reads
  - normalizes WebDAV file items
  - filters known audio extensions
  - creates a local `127.0.0.1` authenticated stream proxy with Range forwarding
- Added renderer `webDavService` and `WebDavStore` for account state, directory state, breadcrumbs, current-directory search, and audio item conversion.
- Added `网盘资源` route with:
  - account selector
  - add/edit/delete account modal
  - connection test
  - directory breadcrumb
  - refresh
  - current-directory search
  - directory/file list
  - play/add-to-list/download actions for audio files
- Added WebDAV playback branch in `resolvePlayableMusicUrl`; WebDAV files resolve to the local proxy URL and do not enter User API or online quality switching.
- Added WebDAV download task creation with original extension preservation and automatic start through the existing download queue.
- Updated source labels and quality controls so WebDAV appears as `网盘资源` and hides online quality switching.
- Updated old-info conversion and download lyric caching so WebDAV is treated as remote file content, not as an online SDK music source.

## USB Exclusive Output Plan And First Implementation

- Added implementation history at `skills/coral-music-desktop/references/refactor-history/2026-06-30-usb-exclusive-output-plan.md`.
- First version targets Windows WASAPI Exclusive and keeps macOS/Linux behind an explicit unsupported probe result.
- Added shared audio-output settings, typed IPC contracts, renderer service, main-process capability gate, and Settings UI controls.
- Added a hybrid player runtime so the existing HTMLAudio/Web Audio path remains the default system output, while exclusive mode can fail back to system output.
- Reserved the out-of-process `coral-wasapi-helper.exe` contract; the real helper still needs to be implemented or bundled before hardware exclusive playback works.

## BASS Native Decoder Plan And First Implementation

- Added implementation history at `skills/coral-music-desktop/references/refactor-history/2026-07-01-bass-native-decoder-plan.md`.
- Selected BASS native + add-ons as the full-format local decoder direction instead of ManagedBass/.NET wrapper, so Electron can keep a native helper boundary.
- Target format set: `aac, ape, dff, dsf, flac, it, m4a, m4b, mo3, mod, mp2, mp3, mp4, mpc, mpga, mtm, ogg, opus, s3m, tta, umx, wav, webm, wv, xm`.
- Added `bass` as an external decoder provider and changed the default local decoder mode to bundled BASS.
- Added packaged resource contract under `resources/native/bass/<platform>-<arch>/` and configured packaging to include `resources/native`.
- Added main-process BASS bundle probing and transcode-helper invocation contract through `coral-bass-decoder`.
- Updated Settings UI so users see `内置 BASS` as the default no-download path, while FFmpeg/Foobar2000 remain fallback/diagnostic options.
- The code path now expects authorized BASS binaries/add-ons plus the helper to be bundled before the mode can actually decode files.

## Library History, Favorites, And Categories Plan And First Implementation

- Added implementation history at `skills/coral-music-desktop/references/refactor-history/2026-06-30-library-history-favorites-categories-plan.md`.
- Added playback history, favorite song-list, and favorite album database tables plus migration path to DB version 3.
- Added a library service/store layer for playback records, favorite songs through the existing love list, favorite song lists, favorite albums, and metadata-driven category groups.
- Added “我的收藏” and “音乐分类” routes; playback history is the first Library tab and category grouping supports album, type, artist, and year.
- Added `smoke:library-capabilities` to guard the new schema, IPC, route, store, and playback-history write boundary.

## DevTools And Startup

- Prevented automatic double DevTools windows during normal `npm run dev`.
- Main DevTools can still be controlled by explicit environment/debug config.
- Hidden lyric/User API windows should not open DevTools during ordinary startup.

## Verification Commands Used

The following checks were repeatedly used after focused change batches:

```bash
npm run typecheck:react
npm run build:renderer
git diff --check
```

For main-process changes, also use:

```bash
npx tsc -p src/main/tsconfig.json --noEmit --pretty false
npm run build:main
```

## Current Dirty Worktree Snapshot

At the time of this note, the active changed areas were:

- App shell route transition and header action disable logic
- Player bar, play detail overlay, and queue drawer
- Download statistics and selection behavior
- Leaderboard route behavior, layout, scrolling, and play-all
- Song list detail loading and play-all
- Online controls source/board interaction
- Player, download, leaderboard, song-list, and UI stores
- Shared renderer CSS for page layout, scrolling, drag regions, and queue drawer

## Follow-Up Risks

- Most verification has been build/typecheck-level. A manual smoke pass should still cover:
  - startup default leaderboard
  - route switching
  - song-list detail entry
  - leaderboard board switching
  - play-all from song list and leaderboard
  - queue drawer opening and queue-item switching
  - online playback quality switch
  - local FLAC playback with local LRC
  - download create/start/statistics
- If further UI work touches list height or `Spin`, verify the full flex chain: route root -> body -> Spin wrapper -> list.
- If future work changes Electron drag regions, confirm app buttons are still clickable before considering the drag issue fixed.
