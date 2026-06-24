# 2026-06-23 Step 36 - Settings User API Actions

## Scope

- Continued the React migration for Settings/User API management.
- Added User API remove and update-alert actions through typed IPC.

## Completed

- Added typed IPC contracts for:
  - `remove_user_api`
  - `user_api_set_allow_update_alert`
- Added React service wrappers:
  - `removeUserApis()`
  - `setUserApiAllowUpdateAlert()`
- Extended `UserApiStore` with:
  - `actionError`
  - `isMutating`
  - `removeUserApis()`
  - `setAllowUpdateAlert()`
- Extended the Settings User API section with:
  - update-alert switch
  - delete action with confirmation
  - fallback `common.apiSource` update when deleting the current API.

## Validation

- Passed: `npm run lint`
- Passed: `npm run build:renderer`
- Passed: `npm run build`

## Next Plan

- Map User API import and online import flows.
- Map theme selector/editor service boundaries.
- Keep download start/pause/resume controls for a dedicated worker-lifecycle batch.
