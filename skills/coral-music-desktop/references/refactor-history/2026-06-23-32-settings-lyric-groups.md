# 2026-06-23 Step 32 - Settings Lyric Groups

## Scope

- Continued the React migration for the Settings route.
- Added direct persisted settings for play-detail and desktop-lyric behavior.

## Completed

- Added first React controls for `SettingPlayDetail.vue`:
  - active lyric zoom
  - delayed lyric scroll
  - lyric progress seeking
  - lyric alignment
  - lyric font size
- Added first React controls for `SettingDesktopLyric.vue`:
  - enable/lock/hide/top/taskbar behavior
  - visualization and scroll behavior
  - direction, scroll alignment, text alignment
  - font size, line gap, and opacity
- Left desktop lyric color picker, font selection, and window reset for dedicated UI/service batches.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Port the remaining simple persisted settings groups such as ODC.
- Map theme, user API, sync, and hotkey modal/service boundaries.
- Keep download start/pause/resume controls for a dedicated worker-lifecycle batch.
