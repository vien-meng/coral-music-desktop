# 2026-06-23 Step 40-41 - SettingOther + SettingAbout

## Scope

- Migrated the "Other" settings section (transparent window, tray theme, cache cleanup, clear list data, dislike list entry).
- Migrated the "About" settings section (open-source links, download links, FAQ, issue reporting, anti-scam notice).
- Added typed IPC contracts for cache management and save dialog.

## Completed

### 40.1 IPC Contract Extensions
- Added `showSaveDialog`, `getCacheSize`, `clearCache`, `getOtherSourceCount`, `clearOtherSource`, `getMusicUrlCount`, `clearMusicUrl`, `getLyricRawCount`, `clearLyricRaw`, `getLyricEditedCount`, `clearLyricEdited` to `winMain` channels
- Added `listDataOverwrite` to `player` channels for full list overwrite
- Added corresponding `IpcContract` type mappings

### 40.2 cacheService
- Created `src/renderer-react/services/cacheService.ts`
- Wraps all 10 cache query/clear methods + `showSaveDialog`
- All methods guarded by `isElectronRenderer()`

### 40.3 listService Extension
- Added `overwriteListFull()` method using `list_data_overwire` IPC channel

### 40.4 SettingOther Section
- Transparent window toggle (`common.transparentWindow`)
- Tray theme radio group (native/black/origin/auto) bound to `tray.themeId`
- 5 cache cleanup items with `Popconfirm` + count display + refresh:
  - Resource cache (with `sizeFormate`)
  - Other source cache
  - Music URL cache
  - Lyric raw cache
  - Lyric edited cache
- Dislike list entry showing rule count + edit button
- Clear all list data with danger `Popconfirm` using `overwriteListFull`

### 41.1 SettingAbout Section
- Open-source GitHub link
- Latest release download link
- FAQ documentation link
- Issue reporting link
- Anti-scam `Alert` notice
- All links use `appService.openUrl()`

## Validation

- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Step 42: SettingBackup (list/setting/all-data import/export).
- Step 43: SettingHotKey (local/global hotkey binding).
- Step 44: ThemeEditModal (color pickers, background image).
- Step 45: Automated code review.
