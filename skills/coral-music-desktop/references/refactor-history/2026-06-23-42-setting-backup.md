# 2026-06-23 Step 42 - SettingBackup

## Scope

- Migrated the backup/restore settings section (list/setting/all-data import/export, text/CSV export).
- Added a new backupService that handles file I/O, old/new format migration, and list overwrite.

## Completed

### 42.1 backupService
- Created `src/renderer-react/services/backupService.ts`
- Uses `@common/utils/nodejs` (`readCoralConfigFile`, `saveCoralConfigFile`, `saveStrToFile`, `joinPath`)
- Uses `@common/utils/common` (`filterFileName`)
- Uses `@common/utils/tools` (`filterMusicList`, `fixNewMusicInfoQuality`, `toNewMusicInfo`)
- Uses `@common/utils/migrateSetting` for old setting migration
- Methods:
  - `importAllData(path)` - handles `allData` (old) and `allData_v2` (new) formats
  - `exportAllData(path, appSetting)` - exports as `allData_v2`
  - `importSetting(path)` - handles `setting` (old) and `setting_v2` (new) formats
  - `exportSetting(path, appSetting)` - exports as `setting_v2`
  - `importPlayList(path)` - handles `defautlList`, `playList`, `playList_v2` formats
  - `exportPlayList(path)` - exports as `playList_v2`
  - `exportPlayListToText(savePath, isMerge)` - exports as `.txt`
  - `exportPlayListToCsv(savePath, isMerge, header)` - exports as `.csv`
- Import setting forces `common.isAgreePact = false` (matching legacy behavior)

### 42.2 SettingBackup Section
- Added "备份" section to SettingsRoutePanel with 3 groups:
  - 部分备份: import/export playlist, import/export settings
  - 全量备份: import/export all data (with confirmation modal)
  - 其他导出: export as text/CSV (with merge/split confirmation modal)
- Uses `appService.showSelectDialog` for file selection
- Uses `cacheService.showSaveDialog` for save location
- Uses `Modal.confirm` for destructive import operations

## Validation

- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Step 43: SettingHotKey (local/global hotkey binding).
- Step 44: ThemeEditModal (color pickers, background image).
- Step 45: Automated code review.
