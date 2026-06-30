# 2026-06-23 Step 43 - SettingHotKey

## Scope

- Migrated the hotkey settings section (local and global hotkey binding).
- Added typed IPC contracts for hotkey enable/config/status.
- Created a hotKeyService and a dedicated HotKeySection component.

## Completed

### 43.1 IPC Contract Extensions
- Added `hotKeyEnable`, `hotKeySetConfig`, `hotKeyStatus` to `winMain` channels
- Imported `HOTKEY_RENDERER_EVENT_NAME` from `@common/ipcNames`
- Added `IpcContract` type mappings:
  - `hotKeyEnable`: `boolean` → `void`
  - `hotKeySetConfig`: `Coral.HotKeyActions` → `void`
  - `hotKeyStatus`: `undefined` → `Coral.HotKeyState`

### 43.2 hotKeyService
- Created `src/renderer-react/services/hotKeyService.ts`
- Exports `allHotKeys` (merged `HOTKEY_COMMON` + `HOTKEY_PLAYER` for local, + `HOTKEY_DESKTOP_LYRIC` for global)
- Methods: `setHotKeyEnable`, `setHotKeyConfig`, `getHotKeyStatus`, `formatHotKeyName`
- `formatHotKeyName` handles arrow keys, mod (Command/Ctrl), alt (Option/Alt), and capitalization

### 43.3 HotKeySection Component
- Created `src/renderer-react/features/settings/HotKeySection.tsx`
- MobX-based `HotKeyStore` with config and status observables
- Loads initial config from `window.coral.appHotKeyConfig`
- Local hotkey group: enable switch + key binding inputs
- Global hotkey group: enable switch + key binding inputs + failed registration strikethrough
- Key recording via focus/blur with `setHotKeyEnable(false/true)` guard
- KeyDown handler builds key string from ctrl/meta/alt/shift + key
- Register/unregister global hotkeys on blur
- Save config via `setHotKeyConfig({ action: 'config', data })`

### 43.4 SettingsRoutePanel Integration
- Added "快捷键" section with `<HotKeySection />`

## Validation

- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Step 44: ThemeEditModal (color pickers, background image, dark/preview toggles).
- Step 45: Automated code review.
