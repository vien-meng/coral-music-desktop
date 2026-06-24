# 2026-06-23 Step 37 - User API Import Flow

## Scope

- Continued the React migration for the Settings/User API management.
- Added User API import (file and online) and set-current API actions through typed IPC.
- Added file selection dialog and open-URL service wrappers.

## Completed

- Added typed IPC contracts for:
  - `import_user_api`
  - `set_user_api`
  - `get_user_api_status`
  - `show_select_dialog`
- Added React service wrappers:
  - `importUserApi()`
  - `setUserApi()`
  - `getUserApiStatus()`
  - `showSelectDialog()` in `appService`
  - `openUrl()` in `appService` using Electron `shell.openExternal`
- Extended `UserApiStore` with:
  - `status` field for current User API status
  - `importUserApi()` action that imports a script and refreshes status
  - `setUserApi()` action that selects the current API and refreshes status
  - status refresh in `hydrate()`, `refreshUserApis()`, and `removeUserApis()`
- Extended the Settings User API section with:
  - import file button (uses `showSelectDialog` + `readFile`)
  - online import button and `OnlineImportModal` component (uses `fetch`)
  - set-current API button per list item
  - custom source documentation link button
  - 20-API limit guard matching legacy behavior

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Map theme selector/editor service boundaries.
- Keep download start/pause/resume controls for a dedicated worker-lifecycle batch.
